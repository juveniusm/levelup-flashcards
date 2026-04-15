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

        const getCachedStats = unstable_cache(
            async (uid: string, tz: string) => statsService.calculateUserStats(uid, tz),
            [`stats-${user.id}`],
            { revalidate: 60, tags: [`stats-${user.id}`] }
        );

        const stats = await getCachedStats(user.id, timezone);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: 'Database out of sync or unavailable' },
            { status: 500 }
        );
    }
}
