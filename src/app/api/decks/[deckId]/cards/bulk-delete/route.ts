import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";

const MAX_BULK_DELETE = 1000;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Match the single-card DELETE policy: admin-only
    if (auth.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { cardIds } = await request.json();

        if (!Array.isArray(cardIds) || cardIds.length === 0) {
            return NextResponse.json({ error: "cardIds must be a non-empty array" }, { status: 400 });
        }

        if (cardIds.length > MAX_BULK_DELETE) {
            return NextResponse.json({ error: `Cannot delete more than ${MAX_BULK_DELETE} cards at once.` }, { status: 400 });
        }

        if (!cardIds.every((id) => typeof id === "string")) {
            return NextResponse.json({ error: "All cardIds must be strings" }, { status: 400 });
        }

        // Delete SM2Stats first (parity with the single-card DELETE route). BOTH deletes are
        // scoped to this deck — the SM2Stats delete via the card relation, the Cards delete via
        // deck_id — so a payload that mixes in card IDs from other decks cannot destroy their
        // Cards OR their SM2Stats.
        const [, deleted] = await prisma.$transaction([
            prisma.sM2Stats.deleteMany({ where: { card_id: { in: cardIds }, card: { deck_id: deckId } } }),
            prisma.cards.deleteMany({ where: { id: { in: cardIds }, deck_id: deckId } }),
        ]);

        return NextResponse.json({ success: true, count: deleted.count });
    } catch (error) {
        console.error("Bulk delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
