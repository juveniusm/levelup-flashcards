import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface DeckWithStats {
    id: string;
    user_id: string;
    title: string;
    deck_seq: number | null;
    _count: { cards: number };
    dueCount: number;
    mastery: number; // Percentage
    difficultyCounts: Record<string, number>;
}

export const deckService = {
    /**
     * Fetches decks based on user ID and role, including card counts, due counts, mastery, and difficulty breakdowns.
     */
    async fetchDecksWithStats(userId: string, role: string, mode?: string): Promise<DeckWithStats[]> {
        const now = new Date();

        let whereClause: Prisma.DecksWhereInput = { user_id: userId };

        if (mode === "creator") {
            whereClause = role === "ADMIN"
                ? { user: { role: "ADMIN" } }
                : { user_id: userId };
        } else {
            whereClause = {
                OR: [
                    { user_id: userId },
                    { is_public: true },
                ],
            };
        }

        const decks = await prisma.decks.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { cards: true },
                },
            },
            orderBy: {
                title: "asc",
            },
        });

        const deckIds = decks.map(d => d.id);
        if (deckIds.length === 0) return [];

        // 1. Fetch Aggregated Stats in ONE query
        // We use a LEFT JOIN on SM2Stats to ensure we count cards that have no stats (New Cards)
        // We filter stats by user_id in the JOIN condition to get personal progress.
        const stats: any[] = await prisma.$queryRaw`
            SELECT 
                c.deck_id,
                COUNT(c.id)::int as total_cards,
                SUM(CASE WHEN s.next_review <= ${now} THEN 1 ELSE 0 END)::int as due_count,
                SUM(CASE WHEN s.ease_factor >= 2.5 AND s.interval >= 21 THEN 1 ELSE 0 END)::int as mastered_count,
                SUM(CASE WHEN s.ease_factor >= 2.5 AND s.interval >= 21 THEN 1 ELSE 0 END)::int as bucket_mastered,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor <= 1.5 THEN 1 ELSE 0 END)::int as bucket_very_hard,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor > 1.5 AND s.ease_factor <= 1.8 THEN 1 ELSE 0 END)::int as bucket_hard,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor > 1.8 AND s.ease_factor <= 2.2 THEN 1 ELSE 0 END)::int as bucket_medium,
                SUM(CASE WHEN s.id IS NULL OR (NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor > 2.2) THEN 1 ELSE 0 END)::int as bucket_easy
            FROM "Cards" c
            LEFT JOIN "SM2Stats" s ON c.id = s.card_id AND s.user_id = ${userId}
            WHERE c.deck_id IN (${Prisma.join(deckIds)})
            GROUP BY c.deck_id
        `;

        // Map aggregated stats by deckId
        const statsMap = stats.reduce((acc, row) => {
            acc[row.deck_id] = {
                due: row.due_count,
                mastered: row.mastered_count,
                difficultyCounts: {
                    "Very Hard": row.bucket_very_hard,
                    "Hard": row.bucket_hard,
                    "Medium": row.bucket_medium,
                    "Easy": row.bucket_easy,
                    "Mastered": row.bucket_mastered
                }
            };
            return acc;
        }, {} as Record<string, any>);

        return decks.map((deck) => {
            const deckStats = statsMap[deck.id] || { 
                due: 0, 
                mastered: 0, 
                difficultyCounts: { "Very Hard": 0, "Hard": 0, "Medium": 0, "Easy": 0, "Mastered": 0 } 
            };
            
            const totalCards = deck._count.cards;
            const masteryPercent = totalCards > 0 
                ? Math.round((deckStats.mastered / totalCards) * 100) 
                : 0;

            return {
                id: deck.id,
                user_id: deck.user_id,
                title: deck.title,
                deck_seq: deck.deck_seq,
                _count: deck._count,
                dueCount: deckStats.due,
                mastery: masteryPercent,
                difficultyCounts: deckStats.difficultyCounts
            };
        });
    },

    /**
     * Creates a new deck with an incremented sequence.
     */
    async createDeck(userId: string, title: string, role: string) {
        // Find max sequence across ALL decks (global counter, not per-user)
        const lastDeck = await prisma.decks.findFirst({
            orderBy: { deck_seq: 'desc' },
        });

        const nextSeq = (lastDeck?.deck_seq || 0) + 1;

        return await prisma.decks.create({
            data: {
                title,
                user_id: userId,
                deck_seq: nextSeq,
                is_public: role === "ADMIN",
            },
        });
    },

    /**
     * Retrieves a single deck by its ID along with its cards, 
     * ordered by card sequence in descending order.
     */
    async getDeckByIdWithCards(deckId: string) {
        return await prisma.decks.findUnique({
            where: { id: deckId },
            include: {
                cards: {
                    orderBy: { card_seq: "desc" }
                }
            }
        });
    }
};
