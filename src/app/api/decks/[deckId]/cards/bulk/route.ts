import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const MAX_BULK_CARDS = 500;

/** Check if the user has permission to manage cards in this deck */
async function requireAccess(deckId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized", status: 401 };

    const userId = (session.user as { id: string }).id;
    const role = (session.user as { role?: string }).role;

    const deck = await prisma.decks.findUnique({
        where: { id: deckId },
        select: { user_id: true }
    });

    if (!deck) return { error: "Deck not found", status: 404 };

    // Owners and Admins can manage the deck
    if (deck.user_id !== userId && role !== "ADMIN") {
        return { error: "Forbidden", status: 403 };
    }

    return { session, userId, role };
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { deckId } = await params;
        const cards = await request.json();

        if (!Array.isArray(cards) || cards.length === 0) {
            return NextResponse.json({ error: "Payload must be a non-empty array of cards" }, { status: 400 });
        }

        if (cards.length > MAX_BULK_CARDS) {
            return NextResponse.json({ error: `Cannot import more than ${MAX_BULK_CARDS} cards at once.` }, { status: 400 });
        }

        // Validate and sanitise each card
        const validCards = cards.filter((c) => c.front && c.back && typeof c.front === "string" && typeof c.back === "string");

        if (validCards.length === 0) {
            return NextResponse.json({ error: "No valid cards found. Ensure front and back are provided." }, { status: 400 });
        }

        const lastCard = await prisma.cards.findFirst({
            where: { deck_id: deckId },
            orderBy: { card_seq: "desc" },
        });

        let nextSeq = (lastCard?.card_seq || 0) + 1;
        let createdCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const cardData of validCards) {
                await tx.cards.create({
                    data: {
                        front: String(cardData.front).trim(),
                        back: String(cardData.back).trim(),
                        deck_id: deckId,
                        card_seq: nextSeq++,
                    },
                });
                createdCount++;
            }
        });

        return NextResponse.json({ success: true, count: createdCount });
    } catch (error) {
        console.error("Bulk import error:", error);
        return NextResponse.json({ error: "Failed to create cards via bulk import" }, { status: 500 });
    }
}
