export { default } from "next-auth/middleware"

export const config = {
    matcher: ["/study/:path*", "/creator/:path*", "/stats/:path*", "/settings/:path*"]
}
