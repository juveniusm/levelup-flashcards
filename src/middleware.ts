import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // If you need to let people access /admin/login, catch it here:
        if (req.nextUrl.pathname === "/admin/login") {
            return NextResponse.next();
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // This ensures the user actually has a valid JWT session token
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/study/:path*",
        "/stats/:path*",
        "/creator/:path*",
        "/admin/:path*", // Catches all admin routes (we exclude /admin/login in the function above)
    ],
};
