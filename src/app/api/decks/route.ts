import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { deckService } from "@/lib/services/deckService";

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
    } catch (error) {
        console.error("GET decks error:", error);
        return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        const { title } = await request.json();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const deck = await deckService.createDeck(user.id, title, user.role);

        return NextResponse.json(deck, { status: 201 });
    } catch (error) {
        console.error("POST deck error:", error);
        return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
    }
}
