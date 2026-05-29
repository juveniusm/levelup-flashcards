import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { normalizeTimezone } from "@/lib/timezone";
import { reviewService } from "@/lib/services/reviewService";

interface QueuedReview {
    deckId: string;
    cardId: string;
    qualityGrade: number;
    isReviewMode: boolean;
    timestamp: number;
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reviews, timezone }: { reviews: QueuedReview[]; timezone: string } = await request.json();

        const MAX_SYNC_REVIEWS = 500;

        if (!reviews || !Array.isArray(reviews)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        if (reviews.length > MAX_SYNC_REVIEWS) {
            return NextResponse.json({ error: `Cannot sync more than ${MAX_SYNC_REVIEWS} reviews at once.` }, { status: 400 });
        }

        const userTz = normalizeTimezone(timezone);
        let totalXpEarned = 0;

        // Ensure chronological order
        const sortedReviews = [...reviews].sort((a, b) => a.timestamp - b.timestamp);

        // We run these sequentially to ensure Last-Write-Wins logic resolves perfectly against fresh Postgres state
        for (const review of sortedReviews) {
            const { deckId, cardId, qualityGrade, isReviewMode, timestamp } = review;

            // Skip malformed/corrupt review entries (e.g. stale Dexie outbox entries)
            if (!cardId || !deckId || typeof qualityGrade !== "number" || qualityGrade < 0 || qualityGrade > 5 || !timestamp) {
                console.warn("Sync: Skipping malformed review entry:", JSON.stringify(review));
                continue;
            }

            let reviewTime = new Date(timestamp);
            if (isNaN(reviewTime.getTime())) {
                console.warn("Sync: Skipping review with invalid timestamp:", timestamp);
                continue;
            }
            // Never trust a future timestamp (would forge streaks); clamp to now (5-min skew).
            const nowMs = Date.now();
            if (reviewTime.getTime() > nowMs + 5 * 60 * 1000) {
                reviewTime = new Date(nowMs);
            }

            // Authorization: only accept reviews for a card the user owns or that belongs to a
            // public deck, and only when the card actually belongs to the claimed deck. Mirrors
            // the live review route; without this, a client could write logs/stats/XP for
            // arbitrary or other users' cards.
            const card = await prisma.cards.findUnique({
                where: { id: cardId },
                select: { deck_id: true, deck: { select: { user_id: true, is_public: true } } },
            });
            if (!card || !card.deck || card.deck_id !== deckId) {
                console.warn("Sync: Skipping review for unknown card or deck mismatch:", cardId, deckId);
                continue;
            }
            if (card.deck.user_id !== userId && card.deck.is_public !== true) {
                console.warn("Sync: Skipping review for inaccessible card:", cardId);
                continue;
            }

            // Offline sync: persist the client reviewed_at, always advance the schedule, and run
            // the LWW gatekeeper so a stale offline entry never clobbers fresher online state.
            const { skipped, stats } = await reviewService.processReview(
                {
                    userId,
                    card,
                    cardId,
                    qualityGrade,
                    isReviewMode,
                    userTz,
                    reviewTime,
                },
                {
                    persistReviewedAt: true,
                    alwaysAdvanceSchedule: true,
                    enforceLastWriteWins: true,
                }
            );

            if (!skipped && stats) {
                totalXpEarned += stats.xpEarned;
            }
        }

        return NextResponse.json({ success: true, totalXpEarned });

    } catch (error: any) {
        console.error("Sync API error:", error);
        const body: Record<string, unknown> = { error: "Internal Server Error" };
        if (process.env.NODE_ENV !== "production") {
            body.details = error?.message || String(error);
            body.stack = error?.stack?.split("\n").slice(0, 5);
        }
        return NextResponse.json(body, { status: 500 });
    }
}
