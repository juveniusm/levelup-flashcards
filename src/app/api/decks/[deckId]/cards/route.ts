import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";
import { isSafeImageUrl } from "@/lib/url-safety";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { front, back, acceptedAnswers, front_image_url, back_image_url } = await request.json();

        if (!front || !back || typeof front !== "string" || typeof back !== "string") {
            return NextResponse.json({ error: "Front and back text are required" }, { status: 400 });
        }

        // Run duplicate check and sequence check in parallel
        const [duplicate, lastCard] = await prisma.$transaction([
            prisma.cards.findFirst({
                where: {
                    deck_id: deckId,
                    front: { equals: front.trim(), mode: "insensitive" },
                    back: { equals: back.trim(), mode: "insensitive" },
                },
            }),
            prisma.cards.findFirst({
                where: { deck_id: deckId },
                orderBy: { card_seq: "desc" },
            })
        ]);

        if (duplicate) {
            return NextResponse.json(
                { error: "A card with the same prompt and answer already exists in this deck." },
                { status: 409 }
            );
        }

        const nextSeq = (lastCard?.card_seq || 0) + 1;

        const card = await prisma.cards.create({
            data: {
                front: front.trim(),
                back: back.trim(),
                acceptedAnswers: Array.isArray(acceptedAnswers) ? acceptedAnswers.filter(a => typeof a === "string" && a.trim() !== "").map(a => a.trim()) : [],
                front_image_url: isSafeImageUrl(front_image_url) ? front_image_url : null,
                back_image_url: isSafeImageUrl(back_image_url) ? back_image_url : null,
                deck_id: deckId,
                card_seq: nextSeq,
            },
        });

        return NextResponse.json(card);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
    }
}
