import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getLevelFromXp, getLevelTitle } from "@/utils/xp/xpUtils";
import { unstable_cache } from 'next/cache';

export const dynamic = "force-dynamic";

// Data fetching logic wrapped in unstable_cache
const getCachedStats = unstable_cache(
    async (userId: string) => {
        const now = new Date();

        // --- Batch A: Counts and Basic User Stats ---
        // Grouping into two batches to prevent DB connection exhaustion in serverless environments.
        const [
            totalDecks,
            totalCards,
            totalReviews,
            cardsStudied,
            cardsDueToday
        ] = await Promise.all([
            prisma.decks.count({
                where: { user_id: userId } // Strictly personal creations
            }),
            prisma.cards.count({
                where: { deck: { user_id: userId } } // Strictly personal creations
            }),
            prisma.reviewLog.count({ where: { user_id: userId } }),
            prisma.sM2Stats.count({ where: { user_id: userId } }),
            prisma.sM2Stats.count({ where: { user_id: userId, next_review: { lte: now } } }),
        ]);

        // --- Batch B: Detailed Records and Lookups ---
        const [
            allStats,
            recentReviews,
            userStatsRecord,
            decksWithCardIds
        ] = await Promise.all([
            prisma.sM2Stats.findMany({
                where: { user_id: userId },
                select: { card_id: true, ease_factor: true, interval: true, next_review: true },
            }),
            prisma.reviewLog.findMany({
                where: {
                    user_id: userId,
                    reviewed_at: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
                },
                select: { reviewed_at: true, mode: true },
            }),
            prisma.userStats.findUnique({
                where: { user_id: userId },
                select: { total_xp: true }
            }),
            prisma.decks.findMany({
                where: { OR: [{ user_id: userId }, { is_public: true }] },
                select: {
                    id: true,
                    title: true,
                    cards: { select: { id: true } }
                },
                orderBy: { title: "asc" },
            })
        ]);

        // --- Mastery Calculations (In-Memory) ---
        const masteredCards = allStats.filter(
            (s) => s.ease_factor >= 2.5 && s.interval >= 21
        ).length;
        const learningCards = allStats.length - masteredCards;
        const newCards = totalCards - allStats.length;
        const avgEaseFactor =
            allStats.length > 0
                ? allStats.reduce((sum, s) => sum + s.ease_factor, 0) / allStats.length
                : 2.5;

        // --- Activity Calculations (In-Memory) ---
        const dailyMap = new Map<string, number>();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dailyMap.set(d.toISOString().split("T")[0], 0);
        }

        const modeBreakdown = { review: 0, study: 0, endless: 0 };
        for (const r of recentReviews) {
            const dateKey = r.reviewed_at.toISOString().split("T")[0];
            if (dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
            }

            if (r.mode === "review") modeBreakdown.review++;
            else if (r.mode === "endless") modeBreakdown.endless++;
            else modeBreakdown.study++;
        }

        const dailyReviews = Array.from(dailyMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const todayKey = now.toISOString().split("T")[0];
        const reviewsToday = dailyMap.get(todayKey) || 0;

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const reviewsThisWeek = recentReviews.filter(r => r.reviewed_at >= startOfWeek).length;

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const reviewsThisMonth = recentReviews.filter(r => r.reviewed_at >= startOfMonth).length;

        // --- Optimized Deck Breakdown (In-Memory) ---
        const statsMap = new Map(allStats.map(s => [s.card_id, s]));

        const deckBreakdown = decksWithCardIds.map((deck) => {
            let mastered = 0;
            let due = 0;
            let totalEase = 0;
            let statsCount = 0;

            for (const card of deck.cards) {
                const s = statsMap.get(card.id);
                if (s) {
                    statsCount++;
                    totalEase += s.ease_factor;
                    if (s.ease_factor >= 2.5 && s.interval >= 21) mastered++;
                    if (s.next_review <= now) due++;
                }
            }

            return {
                deckId: deck.id,
                title: deck.title,
                totalCards: deck.cards.length,
                mastered,
                due,
                avgEase: statsCount > 0 ? Math.round((totalEase / statsCount) * 100) / 100 : 0,
            };
        });

        const totalXp = userStatsRecord?.total_xp ?? 0;
        const { level } = getLevelFromXp(totalXp);
        const title = getLevelTitle(level);

        return {
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
        };
    },
    ['user-stats'],
    { revalidate: 10, tags: ['stats'] }
);

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;

        if (!userId) {
            return NextResponse.json({ error: "User ID missing in session" }, { status: 400 });
        }

        const stats = await getCachedStats(userId);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: 'Database out of sync or unavailable' },
            { status: 500 }
        );
    }
}
