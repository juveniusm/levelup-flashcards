import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDeckAccess } from "@/lib/deck-access";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
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
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
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
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
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

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const auth = await requireDeckAccess(deckId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();

        if (!("folder_id" in body)) {
            return NextResponse.json({ error: "folder_id is required" }, { status: 400 });
        }

        const folderId = body.folder_id;
        if (folderId !== null && typeof folderId !== "string") {
            return NextResponse.json({ error: "folder_id must be a string or null" }, { status: 400 });
        }

        // If moving into a folder, verify the folder belongs to the same user
        if (folderId !== null) {
            const folder = await prisma.folder.findUnique({
                where: { id: folderId },
                select: { user_id: true },
            });
            if (!folder) {
                return NextResponse.json({ error: "Folder not found" }, { status: 404 });
            }
            if (folder.user_id !== auth.userId && auth.role !== "ADMIN") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const updated = await prisma.decks.update({
            where: { id: deckId },
            data: { folder_id: folderId },
        });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Failed to move deck" }, { status: 500 });
    }
}
