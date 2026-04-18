import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { deckService } from "@/lib/services/deckService";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode") || undefined;

        const decks = await deckService.fetchDecksWithStats(user.id, user.role, mode);

        return NextResponse.json(decks);
    } catch (error: unknown) {
        console.error("GET decks error:", error);
        return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, folder_id } = body;

        if (!title || typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (folder_id !== undefined && folder_id !== null && typeof folder_id !== "string") {
            return NextResponse.json({ error: "folder_id must be a string or null" }, { status: 400 });
        }

        // Verify folder ownership when one is supplied
        if (folder_id) {
            const folder = await prisma.folder.findUnique({
                where: { id: folder_id },
                select: { user_id: true },
            });
            if (!folder) {
                return NextResponse.json({ error: "Folder not found" }, { status: 404 });
            }
            if (folder.user_id !== user.id && user.role !== "ADMIN") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const deck = await deckService.createDeck(user.id, title, user.role, folder_id ?? null);

        return NextResponse.json(deck, { status: 201 });
    } catch (error: unknown) {
        console.error("POST deck error:", error);
        return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
    }
}
