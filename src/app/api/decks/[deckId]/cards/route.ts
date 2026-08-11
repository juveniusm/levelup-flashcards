import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";
import { isSafeImageUrl } from "@/lib/url-safety";
import { ServiceError } from "@/lib/errors";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Card mutations are admin-only (matches edit/delete/bulk-delete).
    if (auth.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { front, back, acceptedAnswers, front_image_url, back_image_url } = await request.json();

        if (!front || !back || typeof front !== "string" || typeof back !== "string") {
            return NextResponse.json({ error: "Front and back text are required" }, { status: 400 });
        }

        // The duplicate check, the sequence read and the insert all belong to one transaction.
        // Previously only the two reads were wrapped and the create ran afterwards, so two
        // simultaneous submissions could both pass the duplicate check, or claim the same
        // card_seq (which is half of the card's display ID).
        const card = await prisma.$transaction(async (tx) => {
            const duplicate = await tx.cards.findFirst({
                where: {
                    deck_id: deckId,
                    front: { equals: front.trim(), mode: "insensitive" },
                    back: { equals: back.trim(), mode: "insensitive" },
                },
                select: { id: true },
            });

            if (duplicate) {
                // Thrown rather than returned so the transaction rolls back; the catch below
                // turns it back into the 409 this route has always returned.
                throw new ServiceError(
                    "A card with the same prompt and answer already exists in this deck.",
                    409
                );
            }

            const lastCard = await tx.cards.findFirst({
                where: { deck_id: deckId },
                orderBy: { card_seq: "desc" },
                select: { card_seq: true },
            });

            return await tx.cards.create({
                data: {
                    front: front.trim(),
                    back: back.trim(),
                    acceptedAnswers: Array.isArray(acceptedAnswers) ? acceptedAnswers.filter(a => typeof a === "string" && a.trim() !== "").map(a => a.trim()) : [],
                    front_image_url: isSafeImageUrl(front_image_url) ? front_image_url : null,
                    back_image_url: isSafeImageUrl(back_image_url) ? back_image_url : null,
                    deck_id: deckId,
                    card_seq: (lastCard?.card_seq || 0) + 1,
                },
            });
        });

        return NextResponse.json(card);
    } catch (error) {
        if (error instanceof ServiceError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
    }
}
