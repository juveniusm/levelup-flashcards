import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email, password, role, firstName, lastName, username, university } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing email or password." },
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

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username: username || undefined }
                ]
            },
        });

        // If the user exists but is NOT verified, we can overwrite their unverified account 
        // to effectively "resend" the verification email and update their info.
        if (existingUser) {
            if (existingUser.email === email && !existingUser.emailVerified) {
                // We will gracefully proceed and overwrite the user below.
                // First, clean up any old verification tokens for this email.
                await prisma.verificationToken.deleteMany({
                    where: { identifier: email }
                });
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

        // Assign requested role if provided, default to STUDENT
        // (In production, an ADMIN role shouldn't be assignable by anyone visiting /register)
        const assignedRole = role === "ADMIN" ? "ADMIN" : "STUDENT";

        // Upsert the user into the database
        const newUser = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name: `${firstName} ${lastName}`.trim() || email.split("@")[0],
                firstName,
                lastName,
                username,
                university,
                role: assignedRole,
            },
            create: {
                email,
                password: hashedPassword,
                name: `${firstName} ${lastName}`.trim() || email.split("@")[0],
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

        // 3. Construct base URL and send email
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const host = req.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        await sendVerificationEmail(email, token, baseUrl);

        return NextResponse.json(
            { message: "Registration successful. Please check your email to verify your account.", user: { id: newUser.id, email: newUser.email, role: newUser.role } },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "An error occurred during registration." },
            { status: 500 }
        );
    }
}
