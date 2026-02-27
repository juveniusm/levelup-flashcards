import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode");

        let whereClause: any = { user_id: userId };

        // If not in creator mode, include public decks
        if (mode !== "creator") {
            whereClause = {
                OR: [
                    { user_id: userId },
                    { is_public: true }
                ]
            };
        }

        const decks = await prisma.decks.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { cards: true }
                }
            },
            orderBy: { title: 'asc' }
        });

        return NextResponse.json(decks);
    } catch (error) {
        console.error("GET decks error:", error);
        return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { title } = await request.json();

        // Ensure session exists
        if (!session || !session.user || !(session.user as { id?: string }).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedUserId = (session.user as { id?: string }).id as string;
        const userRole = (session.user as { role?: string }).role;

        // Find max sequence
        const lastDeck = await prisma.decks.findFirst({
            where: { user_id: resolvedUserId },
            orderBy: { deck_seq: 'desc' },
        });

        const nextSeq = (lastDeck?.deck_seq || 0) + 1;

        const deck = await prisma.decks.create({
            data: {
                title,
                user_id: resolvedUserId,
                deck_seq: nextSeq,
                is_public: userRole === "ADMIN", // Admins create public decks by default
            },
        });

        return NextResponse.json(deck, { status: 201 });
    } catch (error) {
        console.error("POST deck error:", error);
        return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
    }
}
