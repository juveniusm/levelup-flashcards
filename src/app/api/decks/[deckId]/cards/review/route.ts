import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { normalizeTimezone } from "@/lib/timezone";
import { reviewService } from "@/lib/services/reviewService";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cardId, qualityGrade, isReviewMode, timezone } = await request.json();
        const userTz = normalizeTimezone(timezone);

        if (typeof cardId !== "string" || typeof qualityGrade !== "number" || qualityGrade < 0 || qualityGrade > 5) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const card = await prisma.cards.findUnique({
            where: { id: cardId },
            include: {
                deck: {
                    select: {
                        id: true,
                        user_id: true,
                        is_public: true
                    }
                }
            }
        });

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // Access control: owner or public deck. (Unchanged: no admin/deckId assertion here — see R7a.)
        const isOwner = card.deck.user_id === user.id;
        const isPublicDeck = card.deck.is_public === true;

        if (!isOwner && !isPublicDeck) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Live review: schedule advances conditionally, no LWW, reviewed_at defaults to now.
        const { sm2, stats } = await reviewService.processReview({
            userId: user.id,
            card,
            cardId,
            qualityGrade,
            isReviewMode,
            userTz,
            reviewTime: new Date(),
        });

        return NextResponse.json({
            success: true,
            stats: sm2,
            ...stats,
        });
    } catch (error) {
        console.error("Review API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
