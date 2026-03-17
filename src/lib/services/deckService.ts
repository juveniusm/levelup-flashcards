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
}

export const deckService = {
    /**
     * Fetches decks based on user ID and role, including card counts, due counts, and mastery.
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

        // 1. Fetch ALL SM2 stats for this user to calculate dueCount and mastery
        const userStats = await prisma.sM2Stats.findMany({
            where: { user_id: userId },
            select: {
                ease_factor: true,
                interval: true,
                next_review: true,
                card: {
                    select: {
                        deck_id: true
                    }
                }
            }
        });

        // Map of deckId -> { due: count, mastered: count }
        const deckStatsMap: Record<string, { due: number, mastered: number }> = {};
        
        userStats.forEach((stat) => {
            const deckId = stat.card.deck_id;
            if (!deckStatsMap[deckId]) {
                deckStatsMap[deckId] = { due: 0, mastered: 0 };
            }

            // Due if next_review <= now
            if (stat.next_review <= now) {
                deckStatsMap[deckId].due++;
            }

            // Mastered if EF >= 2.5 AND interval >= 21 (as defined in studyUtils.ts)
            if ((stat.ease_factor || 0) >= 2.5 && (stat.interval || 0) >= 21) {
                deckStatsMap[deckId].mastered++;
            }
        });

        return decks.map((deck) => {
            const stats = deckStatsMap[deck.id] || { due: 0, mastered: 0 };
            const totalCards = deck._count.cards;
            const masteryPercent = totalCards > 0 
                ? Math.round((stats.mastered / totalCards) * 100) 
                : 0;

            return {
                id: deck.id,
                user_id: deck.user_id,
                title: deck.title,
                deck_seq: deck.deck_seq,
                _count: deck._count,
                dueCount: stats.due,
                mastery: masteryPercent
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
