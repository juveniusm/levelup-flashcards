import NextAuth from "next-auth";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

async function rateLimitedHandler(req: Request, ...args: any[]) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (limiter.check(20, ip)) { // Max 20 auth calls per minute per IP
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
    // Typecast args to match the original handler signature
    return (handler as Function)(req, ...args);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };

