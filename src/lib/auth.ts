import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

// Google returns a single display name; this app stores first/last separately.
function splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
    };
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "student@example.com" },
                password: { label: "Password", type: "password" },
                token: { label: "Token", type: "text" },
                isVerifying: { label: "Is Verifying", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                const identifier = credentials.email.trim();
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            // Email match is case-insensitive so a differently-cased email still
                            // resolves to the same account (emails are case-insensitive in practice).
                            { email: { equals: identifier, mode: "insensitive" } },
                            { username: identifier }
                        ]
                    }
                });

                if (!user) {
                    return null;
                }

                // Handle Auto-Login Verification Flow
                if (credentials.isVerifying === "true" && credentials.token) {
                    const verificationToken = await prisma.verificationToken.findUnique({
                        where: {
                            identifier_token: {
                                identifier: user.email || credentials.email,
                                token: credentials.token,
                            }
                        }
                    });

                    if (!verificationToken || new Date() > verificationToken.expires) {
                        throw new Error("InvalidVerificationLink");
                    }

                    // Separation of Concerns: Execute the DB mutation securely within a transaction
                    const updatedUser = await prisma.$transaction(async (tx) => {
                        const verifiedUser = await tx.user.update({
                            where: { id: user.id },
                            data: { emailVerified: new Date() }
                        });

                        await tx.verificationToken.delete({
                            where: { identifier_token: { identifier: user.email || credentials.email, token: credentials.token } }
                        });

                        return verifiedUser;
                    });

                    return { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role as "ADMIN" | "STUDENT" };
                }

                // Standard Password Login Flow
                if (!credentials.password || !user.password) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(credentials.password, user.password);

                if (!isValidPassword) {
                    return null;
                }

                if (!user.emailVerified) {
                    throw new Error("unverified");
                }

                return { id: user.id, name: user.name, email: user.email, role: user.role as "ADMIN" | "STUDENT" };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        // next-auth forwards only a subset of error codes to the sign-in page; the rest
        // (AccessDenied among them) render on its own unbranded /api/auth/error page unless
        // an error page is configured.
        error: "/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            // Check if this login is coming from the admin login page
            if (account?.provider === "google") {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! }
                });
                if (dbUser?.role !== "ADMIN") {
                    const { cookies } = await import("next/headers");
                    const cookieStore = await cookies();
                    const adminLoginIntent = cookieStore.get("admin_login_intent")?.value === "true";
                    // Returning a URL denies the sign-in exactly like `false` does, but lands the
                    // user back on the admin login page (which shows a proper message) instead of
                    // next-auth's default error page.
                    if (adminLoginIntent) return "/admin/login?error=AccessDenied";
                }

                // Backfill firstName/lastName for accounts that predate the `createUser` event
                // below. First-time Google users don't reach this branch — next-auth runs this
                // callback before the adapter creates the row, so `dbUser` is still null.
                if (dbUser && !dbUser.firstName && user.name) {
                    await prisma.user.update({
                        where: { id: dbUser.id },
                        data: splitName(user.name),
                    });
                }
            }
            return true;
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.role = user.role || "STUDENT";
                token.id = user.id;
            }

            // When the client calls update(), re-read profile from DB
            // so name/role changes take effect immediately.
            if (trigger === "update" && token.id) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { name: true, role: true },
                    });
                    if (dbUser) {
                        token.name = dbUser.name;
                        // Prisma types `role` as a plain string column; coerce to the
                        // known role union for the (now-narrowed) JWT.role field.
                        token.role = (dbUser.role as "ADMIN" | "STUDENT") || "STUDENT";
                    }
                } catch { /* DB unreachable — keep current token */ }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id || token.sub || "";
                session.user.role = token.role || "STUDENT";
                session.user.name = (token.name as string) || session.user.name;
            }
            return session;
        },
    },

    events: {
        // Only the adapter creates users here (credentials accounts come from /api/auth/register),
        // so this fires exactly once per OAuth signup — and, unlike the signIn callback, it runs
        // after the row exists. That's what makes first/last name available from the very first
        // sign-in rather than the second.
        async createUser({ user }) {
            if (!user.name) return;
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: splitName(user.name),
                });
            } catch {
                // A cosmetic backfill must never block account creation; signIn() retries it.
            }
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};
