import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { statsService } from "@/lib/services/statsService";
import { unstable_cache } from 'next/cache';

export const dynamic = "force-dynamic";

// Data fetching logic wrapped in unstable_cache
const getCachedStats = unstable_cache(
    async (userId: string) => {
        return await statsService.calculateUserStats(userId);
    },
    ['user-stats'],
    { revalidate: 10, tags: ['stats'] }
);

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = await getCachedStats(user.id);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: 'Database out of sync or unavailable' },
            { status: 500 }
        );
    }
}
