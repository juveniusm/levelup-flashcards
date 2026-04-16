import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ deckId: string; cardId: string }> }
) {
    const resolvedParams = await params;
    const auth = await requireDeckAccess(resolvedParams.deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Editing cards is restricted to admins only
    if (auth.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { front, back, acceptedAnswers, front_image_url, back_image_url } = await request.json();

        if (!front || !back || typeof front !== "string" || typeof back !== "string") {
            return NextResponse.json({ error: "Front and back text are required" }, { status: 400 });
        }

        const card = await prisma.cards.update({
            where: {
                id: resolvedParams.cardId,
                deck_id: resolvedParams.deckId,
            },
            data: {
                front: front.trim(),
                back: back.trim(),
                acceptedAnswers: Array.isArray(acceptedAnswers) ? acceptedAnswers.filter(a => typeof a === "string" && a.trim() !== "").map(a => a.trim()) : [],
                front_image_url: front_image_url || null,
                back_image_url: back_image_url || null,
            },
        });

        return NextResponse.json(card);
    } catch (error) {
        console.error("Error updating card:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ deckId: string; cardId: string }> }
) {
    const resolvedParams = await params;
    const auth = await requireDeckAccess(resolvedParams.deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Deleting cards is restricted to admins only
    if (auth.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Delete SM2Stats first to avoid FK constraint
        await prisma.sM2Stats.deleteMany({ where: { card_id: resolvedParams.cardId } });

        await prisma.cards.delete({
            where: {
                id: resolvedParams.cardId,
                deck_id: resolvedParams.deckId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting card:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
