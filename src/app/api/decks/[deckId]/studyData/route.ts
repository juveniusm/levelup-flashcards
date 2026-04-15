import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const deck = await prisma.decks.findUnique({
            where: { id: deckId },
            select: {
                id: true,
                title: true,
                cards: {
                    select: {
                        id: true,
                        front: true,
                        back: true,
                        acceptedAnswers: true,
                        front_image_url: true,
                        back_image_url: true,
                        deck_id: true,
                        sm2_stats: {
                            where: { user_id: userId },
                            select: {
                                ease_factor: true,
                                interval: true,
                                next_review: true,
                            },
                        },
                    },
                },
            },
        });

        if (!deck) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        return NextResponse.json({ deck });
    } catch (error) {
        console.error("Failed to fetch study data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
