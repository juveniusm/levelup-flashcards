import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";
import { isSafeImageUrl } from "@/lib/url-safety";

const MAX_BULK_CARDS = 2000;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Card mutations are admin-only (matches single-card create/edit/delete and bulk-delete).
    if (auth.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const cards = await request.json();

        if (process.env.NODE_ENV !== "production") {
            console.log(`[API] Bulk POST to deckId: ${deckId}. Card count: ${cards?.length}`);
            if (Array.isArray(cards) && cards.length > 0) {
                console.log(`[API] First card sample:`, JSON.stringify(cards[0]));
            }
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

        // Counted against everything the user submitted, not just the rows that survived
        // validation — malformed rows are skipped too, and were previously invisible in the
        // total the UI reports back.
        const skippedCount = cards.length - newCards.length;

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

        // Map to DB objects with calculated sequence. Image URLs go through the same safety
        // check the single-card create uses — without them here, an import silently dropped
        // every image while creating the same card one at a time kept it.
        const cardsToInsert = newCards.map((cardData) => ({
            front: String(cardData.front).trim(),
            back: String(cardData.back).trim(),
            acceptedAnswers: Array.isArray(cardData.acceptedAnswers) ? cardData.acceptedAnswers.filter((a: any) => typeof a === "string" && a.trim() !== "").map((a: string) => a.trim()) : [],
            front_image_url: isSafeImageUrl(cardData.front_image_url) ? cardData.front_image_url : null,
            back_image_url: isSafeImageUrl(cardData.back_image_url) ? cardData.back_image_url : null,
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
