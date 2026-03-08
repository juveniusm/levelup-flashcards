import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const path = req.nextUrl.pathname;
        const isAuth = !!req.nextauth.token;

        // If user is authenticated, prevent them from accessing login pages
        if (isAuth && (path === "/login" || path === "/admin/login")) {
            return NextResponse.redirect(new URL("/study", req.url));
        }

        // If you need to let people access /admin/login, catch it here:
        if (path === "/admin/login") {
            return NextResponse.next();
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // This ensures the user actually has a valid JWT session token
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;

                // Allow public access to login pages so the middleware function can handle the redirect logic
                if (path === "/login" || path === "/admin/login") {
                    return true;
                }

                // Strictly enforce ADMIN role for all other /admin routes
                if (path.startsWith("/admin")) {
                    return token?.role === "ADMIN";
                }

                return !!token;
            },
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
        "/login", // Added to allow middleware to redirect authenticated users away from login
    ],
};
