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
    } catch (error: any) {
        console.error("Profile PATCH error:", error);
        const status = error.message.includes("Unauthorized") || error.message.includes("Only admins") ? 403 :
            error.message.includes("required") || error.message.includes("incorrect") ? 400 : 500;
        return NextResponse.json({ error: error.message || "Internal server error" }, { status });
    }
}
