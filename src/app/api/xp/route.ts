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

        const userStats = await prisma.userStats.findUnique({
            where: { user_id: userId },
        });

        const totalXp = userStats?.total_xp ?? 0;
        const { level, currentXp, xpForNextLevel } = getLevelFromXp(totalXp);
        const title = getLevelTitle(level);

        return NextResponse.json({ totalXp, level, currentXp, xpForNextLevel, title });
    } catch (error) {
        console.error("XP API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
