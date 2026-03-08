import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            return NextResponse.redirect(new URL("/login?error=InvalidVerificationLink", req.url));
        }

        // Find the verification token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: email,
                    token,
                }
            }
        });

        if (!verificationToken) {
            return NextResponse.redirect(new URL("/login?error=InvalidVerificationLink", req.url));
        }

        // Check expiration
        if (new Date() > verificationToken.expires) {
            // Delete expired token to keep DB clean
            await prisma.verificationToken.delete({
                where: { identifier_token: { identifier: email, token } }
            });
            return NextResponse.redirect(new URL("/login?error=TokenExpired", req.url));
        }

        // Valid token: update user and clean up token
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.redirect(new URL("/login?error=UserNotFound", req.url));
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { email },
                data: { emailVerified: new Date() }
            }),
            prisma.verificationToken.delete({
                where: { identifier_token: { identifier: email, token } }
            })
        ]);

        return NextResponse.redirect(new URL("/login?verified=true", req.url));

    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.redirect(new URL("/login?error=VerificationFailed", req.url));
    }
}
