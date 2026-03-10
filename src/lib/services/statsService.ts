import prisma from "@/lib/prisma";
import { getLevelFromXp, getLevelTitle } from "@/utils/xp/xpUtils";

const fetchCoreMetrics = async (userId: string, now: Date) => {
    const [
        totalDecks,
        totalCards,
        totalReviews,
        cardsStudied,
        cardsDueToday
    ] = await Promise.all([
        prisma.decks.count({
            where: { user_id: userId }
        }),
        prisma.cards.count({
            where: { deck: { user_id: userId } }
        }),
        prisma.reviewLog.count({ where: { user_id: userId } }),
        prisma.sM2Stats.count({ where: { user_id: userId } }),
        prisma.sM2Stats.count({ where: { user_id: userId, next_review: { lte: now } } }),
    ]);
    return { totalDecks, totalCards, totalReviews, cardsStudied, cardsDueToday };
};

const fetchDetailedRecords = async (userId: string) => {
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
    return { allStats, recentReviews, userStatsRecord, decksWithCardIds };
};

const calculateMastery = (allStats: { ease_factor: number; interval: number }[], totalCards: number) => {
    const masteredCards = allStats.filter(
        (s) => s.ease_factor >= 2.5 && s.interval >= 21
    ).length;
    const learningCards = allStats.length - masteredCards;
    const newCards = totalCards - allStats.length;
    const avgEaseFactor =
        allStats.length > 0
            ? allStats.reduce((sum, s) => sum + s.ease_factor, 0) / allStats.length
            : 2.5;

    return {
        avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
        masteredCards,
        learningCards,
        newCards,
    };
};

const calculateActivity = (recentReviews: { reviewed_at: Date; mode: string }[], now: Date) => {
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

    return {
        modeBreakdown,
        activity: {
            reviewsToday,
            reviewsThisWeek,
            reviewsThisMonth,
            dailyReviews,
        }
    };
};

const calculateDeckBreakdown = (
    decksWithCardIds: { id: string; title: string; cards: { id: string }[] }[],
    allStats: { card_id: string; ease_factor: number; interval: number; next_review: Date }[],
    now: Date
) => {
    const statsMap = new Map(allStats.map(s => [s.card_id, s]));

    return decksWithCardIds.map((deck) => {
        let mastered = 0;
        let easy = 0;
        let medium = 0;
        let hard = 0;
        let veryHard = 0;
        let due = 0;
        let statsCount = 0;

        for (const card of deck.cards) {
            const s = statsMap.get(card.id);
            if (s) {
                statsCount++;
                if (s.ease_factor >= 2.5 && s.interval >= 21) {
                    mastered++;
                } else if (s.ease_factor <= 1.5) {
                    veryHard++;
                } else if (s.ease_factor <= 1.8) {
                    hard++;
                } else if (s.ease_factor <= 2.2) {
                    medium++;
                } else {
                    easy++;
                }

                if (s.next_review <= now) due++;
            }
        }

        return {
            deckId: deck.id,
            title: deck.title,
            totalCards: deck.cards.length,
            mastered,
            easy,
            medium,
            hard,
            veryHard,
            due,
            statsCount,
        };
    }).filter(d => d.statsCount > 0);
};

export const statsService = {
    /**
     * Calculates comprehensive statistics for a user's dashboard.
     */
    async calculateUserStats(userId: string) {
        const now = new Date();

        const coreMetrics = await fetchCoreMetrics(userId, now);
        const detailedRecords = await fetchDetailedRecords(userId);

        const mastery = calculateMastery(detailedRecords.allStats, coreMetrics.totalCards);
        const { modeBreakdown, activity } = calculateActivity(detailedRecords.recentReviews, now);
        const deckBreakdown = calculateDeckBreakdown(detailedRecords.decksWithCardIds, detailedRecords.allStats, now);

        const totalXp = detailedRecords.userStatsRecord?.total_xp ?? 0;
        const { level } = getLevelFromXp(totalXp);
        const title = getLevelTitle(level);

        return {
            overview: coreMetrics,
            mastery,
            activity,
            deckBreakdown,
            modeBreakdown,
            xp: { totalXp, level, title },
        };
    }
};
