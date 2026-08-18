import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
    try {
        // Throttle this unauthenticated endpoint to limit account spam, verification-email
        // bombing, and enumeration. Derive the IP from a trusted source (see auth/upload routes).
        const ip = req.headers.get("x-real-ip")
            || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || "127.0.0.1";
        if (limiter.check(5, `register-ip:${ip}`)) { // Max 5 registration attempts per minute per IP
            return NextResponse.json(
                { error: "Too many requests. Please try again in a minute." },
                { status: 429 }
            );
        }

        const { email, password, firstName, lastName, username, university } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing email or password." },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        // Email format regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format." },
                { status: 400 }
            );
        }

        // Per-email cap: prevents bombing one address with verification emails from many IPs.
        if (limiter.check(3, `register-email:${email.toLowerCase()}`)) { // Max 3 per minute per email
            return NextResponse.json(
                { error: "Too many requests. Please try again in a minute." },
                { status: 429 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username: username || undefined }
                ]
            },
            // Linked accounts are needed to tell a pending credentials signup apart from an OAuth
            // account: next-auth creates Google users with `emailVerified: null`, so they would
            // otherwise look "unverified" to the overwrite path below.
            include: {
                accounts: { select: { provider: true }, take: 1 },
            },
        });

        // If the user exists but is NOT verified, we can overwrite their unverified account
        // to effectively "resend" the verification email and update their info.
        if (existingUser) {
            // Never allow re-registration to overwrite an ADMIN account
            if (existingUser.email === email && existingUser.role === "ADMIN") {
                return NextResponse.json({ error: "User with this email already exists." }, { status: 409 });
            }

            // Only a genuine pending credentials signup may be overwritten — that is what this
            // path is for ("resend the verification email and update their info"). An OAuth user
            // has no password and at least one linked Account row; their `emailVerified` is null
            // only because next-auth never sets it, NOT because the address is unproven. Letting
            // a signup overwrite one would plant a stranger's password on a live account, which
            // becomes a working login the moment the owner clicks the verification email.
            const isPendingCredentialsSignup =
                existingUser.password !== null && existingUser.accounts.length === 0;

            if (existingUser.email === email && !existingUser.emailVerified && isPendingCredentialsSignup) {
                // We will gracefully proceed and overwrite the user below.
                // First, clean up any old verification tokens for this email.
                await prisma.verificationToken.deleteMany({
                    where: { identifier: email }
                });

                // Check if the requested username is taken by a different user
                if (username) {
                    const usernameOwner = await prisma.user.findFirst({
                        where: { username, NOT: { email } }
                    });
                    if (usernameOwner) {
                        return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
                    }
                }
            } else {
                if (existingUser.email === email) {
                    return NextResponse.json({ error: "User with this email already exists." }, { status: 409 });
                }
                if (existingUser.username && existingUser.username === username) {
                    return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
                }
            }
        }

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Always assign STUDENT role via public registration
        const assignedRole = "STUDENT";

        // Coalesce missing name parts so an absent first/last name can't yield "undefined undefined".
        const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || email.split("@")[0];

        // Upsert the user into the database
        const newUser = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name,
                firstName,
                lastName,
                username,
                university,
                role: assignedRole,
            },
            create: {
                email,
                password: hashedPassword,
                name,
                firstName,
                lastName,
                username,
                university,
                role: assignedRole,
            },
        });

        // 1. Generate verification token
        const token = crypto.randomBytes(32).toString("hex");

        // 2. Save token to database
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });

        // 3. Construct base URL from a TRUSTED source and send email.
        // Do NOT derive the verification link from the request Host header: an attacker could set
        // Host to a domain they control and capture the victim's verification token (which alone is
        // enough to log in via the auto-login flow). Use the configured app URL and fail closed.
        // All three sources are server-controlled (env vars / platform-set), never the request,
        // so none can be poisoned by a malicious Host header. NEXTAUTH_URL wins in production;
        // VERCEL_URL covers preview deployments; localhost covers local dev.
        const baseUrl = (
            process.env.NEXTAUTH_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
            || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "")
        ).replace(/\/$/, "");

        if (!baseUrl) {
            console.error("Registration error: NEXTAUTH_URL is not configured; cannot build a trusted verification link.");
            return NextResponse.json(
                { error: "An error occurred during registration." },
                { status: 500 }
            );
        }

        const emailResult = await sendVerificationEmail(email, token, baseUrl);

        if (!emailResult.success) {
            // The account row exists, but it is unreachable until the address is verified and the
            // only way to verify is the link we just failed to deliver. Reporting 201 here is how
            // a missing RESEND_API_KEY turned into a queue of accounts nobody could log into, with
            // every affected user told to check an inbox that would stay empty. Say what happened
            // instead: registering again re-sends, because this address is still unverified.
            console.error("Registration: verification email failed to send for", email);
            return NextResponse.json(
                { error: "Your account was created, but we couldn't send the verification email. Please try registering again in a few minutes." },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { message: "Registration successful. Please check your email to verify your account.", user: { id: newUser.id, email: newUser.email, role: newUser.role } },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Registration error:", error);
        // A unique-constraint violation here is the username (email is the upsert key); the
        // pre-check above is best-effort and racy, so map P2002 to 409 instead of a generic 500.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
        }
        return NextResponse.json(
            { error: "An error occurred during registration." },
            { status: 500 }
        );
    }
}
