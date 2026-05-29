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
    // Only rate limit POST requests (e.g. login attempts) to prevent blocking session validation polling.
    if (req.method === "POST") {
        // Prefer x-real-ip (set by the platform/Vercel, not client-controllable). Fall back to the
        // leftmost x-forwarded-for entry only — taking the whole comma-separated chain would let an
        // attacker send a different value per request and bypass the per-IP limit entirely.
        const ip = req.headers.get("x-real-ip")
            || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || "127.0.0.1";
        if (limiter.check(20, ip)) { // Max 20 auth calls per minute per IP
            return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }
    }
    // Typecast args to match the original handler signature
    return (handler as Function)(req, ...args);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };

