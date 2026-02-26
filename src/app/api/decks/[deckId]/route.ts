import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

/** Only ADMINs can GET, DELETE, or PUT decks */
async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized", status: 401 };
    const role = (session.user as { role?: string }).role;
    if (role !== "ADMIN") return { error: "Forbidden", status: 403 };
    return { session };
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const auth = await requireAdmin();
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
    const auth = await requireAdmin();
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
    const auth = await requireAdmin();
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
