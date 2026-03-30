import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";

const MAX_BULK_CARDS = 2000;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const cards = await request.json();
        console.log(`[API] Bulk POST to deckId: ${deckId}. Card count: ${cards?.length}`);
        if (Array.isArray(cards) && cards.length > 0) {
            console.log(`[API] First card sample:`, JSON.stringify(cards[0]));
        }

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

        // ── Step 1: Deduplicate within the uploaded batch ─────────────────
        const batchSeen = new Set<string>();
        const deduped = validCards.filter((c) => {
            const key = `${String(c.front).trim().toLowerCase()}|||${String(c.back).trim().toLowerCase()}`;
            if (batchSeen.has(key)) return false;
            batchSeen.add(key);
            return true;
        });

        // ── Step 2: Fetch existing cards for this deck ────────────────────
        const existingCards = await prisma.cards.findMany({
            where: { deck_id: deckId },
            select: { front: true, back: true },
        });
        const existingSet = new Set<string>(
            existingCards.map((c) => `${c.front.trim().toLowerCase()}|||${c.back.trim().toLowerCase()}`)
        );

        // ── Step 3: Filter out duplicates versus the existing deck ────────
        const newCards = deduped.filter(
            (c) => !existingSet.has(`${String(c.front).trim().toLowerCase()}|||${String(c.back).trim().toLowerCase()}`)
        );
        const skippedCount = validCards.length - newCards.length;

        // ── Step 4: Nothing new to insert ─────────────────────────────────
        if (newCards.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                skipped: skippedCount,
                message: "All cards already exist in this deck. Nothing was imported.",
            });
        }

        // ── Step 5: Get sequence and Bulk Insert ──────────────────────────
        const lastCard = await prisma.cards.findFirst({
            where: { deck_id: deckId },
            orderBy: { card_seq: "desc" },
        });

        let nextSeq = (lastCard?.card_seq || 0) + 1;

        // Map to DB objects with calculated sequence
        const cardsToInsert = newCards.map((cardData) => ({
            front: String(cardData.front).trim(),
            back: String(cardData.back).trim(),
            acceptedAnswers: Array.isArray(cardData.acceptedAnswers) ? cardData.acceptedAnswers.filter((a: any) => typeof a === "string" && a.trim() !== "").map((a: string) => a.trim()) : [],
            deck_id: deckId,
            card_seq: nextSeq++,
        }));

        let insertedCount = 0;
        const BATCH_SIZE = 500;

        for (let i = 0; i < cardsToInsert.length; i += BATCH_SIZE) {
            const batch = cardsToInsert.slice(i, i + BATCH_SIZE);
            const result = await prisma.cards.createMany({
                data: batch,
            });
            insertedCount += result.count;
        }

        return NextResponse.json({ success: true, count: insertedCount, skipped: skippedCount });

    } catch (error) {
        console.error("Bulk import error:", error);
        return NextResponse.json({ error: "Failed to create cards via bulk import" }, { status: 500 });
    }
}
