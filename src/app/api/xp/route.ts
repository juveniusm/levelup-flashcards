import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getLevelFromXp, getLevelTitle } from "@/utils/xp/xpUtils";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;

        if (!userId) {
            // Fallback Level 1 if ID somehow missing
            const { level, currentXp, xpForNextLevel } = getLevelFromXp(0);
            return NextResponse.json({ totalXp: 0, level, currentXp, xpForNextLevel, title: getLevelTitle(level) });
        }

        let userStats = await prisma.userStats.findUnique({
            where: { user_id: userId },
        });

        if (!userStats) {
            // Proactively create user stats if missing (common for new OAuth users)
            try {
                userStats = await prisma.userStats.create({
                    data: {
                        user_id: userId,
                        total_xp: 0,
                        current_streak: 0
                    }
                });
            } catch (e) {
                // If creation fails (e.g. race condition), just use default 0
                console.warn("Could not create UserStats:", e);
            }
        }

        const totalXp = userStats?.total_xp ?? 0;
        const { level, currentXp, xpForNextLevel } = getLevelFromXp(totalXp);
        const title = getLevelTitle(level);

        return NextResponse.json({ totalXp, level, currentXp, xpForNextLevel, title });
    } catch (error) {
        console.error("XP API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
