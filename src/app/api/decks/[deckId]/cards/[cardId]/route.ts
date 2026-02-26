import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized", status: 401 };
    const role = (session.user as { role?: string }).role;
    if (role !== "ADMIN") return { error: "Forbidden", status: 403 };
    return { session };
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ deckId: string; cardId: string }> }
) {
    const auth = await requireAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const resolvedParams = await params;
        const { front, back, front_image_url, back_image_url } = await request.json();

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
    const auth = await requireAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const resolvedParams = await params;

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
