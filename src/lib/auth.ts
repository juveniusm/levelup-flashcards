import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
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

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.email },
                            { username: credentials.email }
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

                    return { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role };
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

                return { id: user.id, name: user.name, email: user.email, role: user.role };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
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
                    if (adminLoginIntent) return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                // We capture the initial assigned role on login
                token.role = (user as { role: string }).role || "STUDENT";
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id || token.sub || "";
                session.user.role = token.role || "STUDENT";
            }
            return session;
        },
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};
