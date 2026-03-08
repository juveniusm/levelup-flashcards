import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { userService } from "@/lib/services/userService";

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
