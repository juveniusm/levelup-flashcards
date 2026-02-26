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
        const now = new Date();

        // --- Overview ---
        const totalDecks = await prisma.decks.count();
        const totalCards = await prisma.cards.count();
        const totalReviews = await prisma.reviewLog.count({
            where: { user_id: userId },
        });

        const cardsStudied = await prisma.sM2Stats.count({
            where: { user_id: userId },
        });

        // Due today: cards with next_review <= now
        const cardsDueToday = await prisma.sM2Stats.count({
            where: { user_id: userId, next_review: { lte: now } },
        });

        // --- Mastery ---
        const allStats = await prisma.sM2Stats.findMany({
            where: { user_id: userId },
            select: { ease_factor: true, interval: true },
        });

        const masteredCards = allStats.filter(
            (s) => s.ease_factor >= 2.5 && s.interval >= 21
        ).length;
        const learningCards = allStats.length - masteredCards;
        const newCards = totalCards - allStats.length;
        const avgEaseFactor =
            allStats.length > 0
                ? allStats.reduce((sum, s) => sum + s.ease_factor, 0) / allStats.length
                : 2.5;

        // --- Activity (last 30 days) ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentReviews = await prisma.reviewLog.findMany({
            where: { user_id: userId, reviewed_at: { gte: thirtyDaysAgo } },
            select: { reviewed_at: true, mode: true },
        });

        // Build daily reviews map
        const dailyMap = new Map<string, number>();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dailyMap.set(d.toISOString().split("T")[0], 0);
        }
        for (const r of recentReviews) {
            const key = r.reviewed_at.toISOString().split("T")[0];
            dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
        }

        const dailyReviews = Array.from(dailyMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const todayKey = now.toISOString().split("T")[0];
        const reviewsToday = dailyMap.get(todayKey) || 0;

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const reviewsThisWeek = recentReviews.filter(
            (r) => r.reviewed_at >= startOfWeek
        ).length;

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const reviewsThisMonth = recentReviews.filter(
            (r) => r.reviewed_at >= startOfMonth
        ).length;

        // --- Mode Breakdown ---
        const modeBreakdown = { review: 0, study: 0, endless: 0 };
        for (const r of recentReviews) {
            if (r.mode === "review") modeBreakdown.review++;
            else if (r.mode === "endless") modeBreakdown.endless++;
            else modeBreakdown.study++;
        }

        // --- Deck Breakdown ---
        const decks = await prisma.decks.findMany({
            include: {
                _count: { select: { cards: true } },
                cards: {
                    include: {
                        sm2_stats: { where: { user_id: userId } },
                    },
                },
            },
            orderBy: { title: "asc" },
        });

        const deckBreakdown = decks.map((deck) => {
            const stats = deck.cards
                .map((c) => c.sm2_stats[0])
                .filter(Boolean);
            const mastered = stats.filter(
                (s) => s.ease_factor >= 2.5 && s.interval >= 21
            ).length;
            const due = stats.filter(
                (s) => s.next_review <= now
            ).length;
            const avgEase =
                stats.length > 0
                    ? stats.reduce((sum, s) => sum + s.ease_factor, 0) / stats.length
                    : 0;

            return {
                deckId: deck.id,
                title: deck.title,
                totalCards: deck._count.cards,
                mastered,
                due,
                avgEase: Math.round(avgEase * 100) / 100,
            };
        });

        // --- XP ---
        const userStats = await prisma.userStats.findUnique({
            where: { user_id: userId },
        });
        const totalXp = userStats?.total_xp ?? 0;
        const { level } = getLevelFromXp(totalXp);
        const title = getLevelTitle(level);

        return NextResponse.json({
            overview: {
                totalDecks,
                totalCards,
                totalReviews,
                cardsStudied,
                cardsDueToday,
            },
            mastery: {
                avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
                masteredCards,
                learningCards,
                newCards,
            },
            activity: {
                reviewsToday,
                reviewsThisWeek,
                reviewsThisMonth,
                dailyReviews,
            },
            deckBreakdown,
            modeBreakdown,
            xp: { totalXp, level, title },
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
