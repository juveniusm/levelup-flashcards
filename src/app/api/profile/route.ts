import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { userService } from "@/lib/services/userService";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await userService.getUserProfile(user.id);
        if (!profile) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (body?.newPassword !== undefined) {
            if (typeof body.newPassword !== "string" || body.newPassword.length < 8) {
                return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
            }
            // Throttle password-change attempts (the current-password check is a guessing oracle).
            if (limiter.check(10, `profile-pw:${user.id}`)) {
                return NextResponse.json({ error: "Too many attempts. Please try again in a minute." }, { status: 429 });
            }
        }

        const updated = await userService.updateUserProfile(user.id, user.role, body);

        return NextResponse.json({ success: true, updated });
    } catch (error) {
        console.error("Profile PATCH error:", error);
        let errorMsg = "Internal server error";
        let status = 500;

        if (error instanceof Error) {
            errorMsg = error.message;
            if (errorMsg.includes("Unauthorized") || errorMsg.includes("Only admins")) status = 403;
            else if (errorMsg.includes("required") || errorMsg.includes("incorrect")) status = 400;
        }

        return NextResponse.json({ error: errorMsg }, { status });
    }
}
