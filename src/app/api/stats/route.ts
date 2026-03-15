import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { statsService } from "@/lib/services/statsService";
import { unstable_cache } from 'next/cache';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const timezone = searchParams.get("timezone") || "UTC";

        const stats = await statsService.calculateUserStats(user.id, timezone);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: 'Database out of sync or unavailable' },
            { status: 500 }
        );
    }
}
