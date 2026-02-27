import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

/** Check if the user has permission to manage (view/edit/delete) this deck */
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

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { deckId } = await params;
        const deck = await prisma.decks.findUnique({
            where: { id: deckId },
            include: { cards: true },
        });

        if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        return NextResponse.json(deck);
    } catch {
        return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { deckId } = await params;
        await prisma.decks.delete({ where: { id: deckId } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { deckId } = await params;
        const { title } = await request.json();

        if (!title || typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const updatedDeck = await prisma.decks.update({
            where: { id: deckId },
            data: { title: title.trim() },
        });

        return NextResponse.json(updatedDeck);
    } catch {
        return NextResponse.json({ error: "Failed to update deck" }, { status: 500 });
    }
}
