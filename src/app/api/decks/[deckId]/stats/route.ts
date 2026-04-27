import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        const role = (session?.user as { role?: string } | undefined)?.role;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Access control: owner, public deck, or admin
        const access = await prisma.decks.findUnique({
            where: { id: deckId },
            select: { user_id: true, is_public: true },
        });

        if (!access) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        if (access.user_id !== userId && !access.is_public && role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const now = new Date();

        const stats: any[] = await prisma.$queryRaw`
            SELECT 
                COUNT(c.id)::int as total_cards,
                SUM(CASE WHEN s.next_review <= ${now} THEN 1 ELSE 0 END)::int as due_count,
                SUM(CASE WHEN s.ease_factor >= 2.5 AND s.interval >= 21 THEN 1 ELSE 0 END)::int as bucket_mastered,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor <= 1.5 THEN 1 ELSE 0 END)::int as bucket_very_hard,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor > 1.5 AND s.ease_factor <= 1.8 THEN 1 ELSE 0 END)::int as bucket_hard,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor > 1.8 AND s.ease_factor <= 2.2 THEN 1 ELSE 0 END)::int as bucket_medium,
                SUM(CASE WHEN s.id IS NOT NULL AND NOT (s.ease_factor >= 2.5 AND s.interval >= 21) AND s.ease_factor > 2.2 THEN 1 ELSE 0 END)::int as bucket_easy,
                SUM(CASE WHEN s.id IS NULL THEN 1 ELSE 0 END)::int as bucket_unseen
            FROM "Cards" c
            LEFT JOIN "SM2Stats" s ON c.id = s.card_id AND s.user_id = ${userId}
            WHERE c.deck_id = ${deckId}
        `;

        const row = stats[0] || {};

        return NextResponse.json({
            totalCards: row.total_cards || 0,
            dueCount: row.due_count || 0,
            difficultyCounts: {
                "Unseen": row.bucket_unseen || 0,
                "Very Hard": row.bucket_very_hard || 0,
                "Hard": row.bucket_hard || 0,
                "Medium": row.bucket_medium || 0,
                "Easy": row.bucket_easy || 0,
                "Mastered": row.bucket_mastered || 0,
            }
        });
    } catch (error) {
        console.error("Failed to fetch deck stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
