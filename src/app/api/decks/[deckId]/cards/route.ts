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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const auth = await requireAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { deckId } = await params;
        const { front, back, front_image_url, back_image_url } = await request.json();

        if (!front || !back || typeof front !== "string" || typeof back !== "string") {
            return NextResponse.json({ error: "Front and back text are required" }, { status: 400 });
        }

        const lastCard = await prisma.cards.findFirst({
            where: { deck_id: deckId },
            orderBy: { card_seq: "desc" },
        });

        const nextSeq = (lastCard?.card_seq || 0) + 1;

        const card = await prisma.cards.create({
            data: {
                front: front.trim(),
                back: back.trim(),
                front_image_url: front_image_url || null,
                back_image_url: back_image_url || null,
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
