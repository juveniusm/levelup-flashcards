import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
        return NextResponse.redirect(new URL("/login?error=InvalidVerificationLink", req.url));
    }

    // Redirect to login page to trigger the client-side sign-in securely
    // Action 'verify' prompts the client to use NextAuth signIn automatically
    return NextResponse.redirect(new URL(`/login?action=verify&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, req.url));
}
