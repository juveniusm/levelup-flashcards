import prisma from "@/lib/prisma";

export interface DeckWithStats {
    id: string;
    user_id: string;
    title: string;
    deck_seq: number | null;
    _count: { cards: number };
    dueCount: number;
}

export const deckService = {
    /**
     * Fetches decks based on user ID and role, including card counts and due counts.
     */
    async fetchDecksWithStats(userId: string, role: string, mode?: string): Promise<DeckWithStats[]> {
        const now = new Date();

        let whereClause: any = { user_id: userId };

        if (mode === "creator") {
            // Creator view: admins see all admin-owned decks; users see their own
            whereClause = role === "ADMIN"
                ? { user: { role: "ADMIN" } }
                : { user_id: userId };
        } else {
            // Study/dashboard view: own decks + all public decks
            whereClause = {
                OR: [
                    { user_id: userId },
                    { is_public: true },
                ],
            };
        }

        const [decks, dueStats] = await Promise.all([
            prisma.decks.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: { cards: true },
                    },
                },
                orderBy: {
                    title: "asc",
                },
            }),
            prisma.sM2Stats.findMany({
                where: {
                    user_id: userId,
                    next_review: { lte: now }
                },
                select: {
                    card: {
                        select: {
                            deck_id: true
                        }
                    }
                }
            })
        ]);

        // Map of deckId -> dueCount
        const dueCountMap: Record<string, number> = {};
        dueStats.forEach((stat: any) => {
            const deckId = stat.card.deck_id;
            dueCountMap[deckId] = (dueCountMap[deckId] || 0) + 1;
        });

        return decks.map((deck) => ({
            id: deck.id,
            user_id: deck.user_id,
            title: deck.title,
            deck_seq: deck.deck_seq,
            _count: deck._count,
            dueCount: dueCountMap[deck.id] || 0
        }));
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
    }
};
