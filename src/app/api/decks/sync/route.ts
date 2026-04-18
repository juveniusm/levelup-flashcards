import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateSM2 } from "@/utils/cognitive/sm2";
import { userService } from "@/lib/services/userService";

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

        if (!reviews || !Array.isArray(reviews)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const userTz = timezone || "UTC";
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

            const reviewTime = new Date(timestamp);
            if (isNaN(reviewTime.getTime())) {
                console.warn("Sync: Skipping review with invalid timestamp:", timestamp);
                continue;
            }

            // Log the review event regardless of LWW (for analytics)
            await prisma.reviewLog.create({
                data: {
                    user_id: userId,
                    card_id: cardId,
                    deck_id: deckId,
                    quality_grade: qualityGrade,
                    mode: isReviewMode ? "review" : "study",
                    reviewed_at: reviewTime,
                }
            });

            // SM2 Update Logic (LWW Gatekeeper)
            const existing = await prisma.sM2Stats.findUnique({
                where: { card_id_user_id: { card_id: cardId, user_id: userId } }
            });

            // The LWW Gatekeeper!
            // Check if a more recent ReviewLog exists for this card
            const newerLog = await prisma.reviewLog.findFirst({
                where: {
                    user_id: userId,
                    card_id: cardId,
                    reviewed_at: { gt: reviewTime }
                }
            });

            if (newerLog) {
                // A more recent review has already been processed online.
                console.log(`LWW: Ignored stale SM2 update for card ${cardId}`);
                continue;
            }

            const prevEase = existing?.ease_factor ?? 2.5;
            const prevReps = existing?.repetitions ?? 0;

            const result = calculateSM2(qualityGrade, prevReps, prevEase, userTz);

            const updateData = {
                ease_factor: result.ease_factor,
                interval: result.interval,
                repetitions: result.repetitions,
                next_review: result.next_review,
            };

            await prisma.sM2Stats.upsert({
                where: { card_id_user_id: { card_id: cardId, user_id: userId } },
                update: updateData,
                create: {
                    card_id: cardId,
                    user_id: userId,
                    ease_factor: result.ease_factor,
                    interval: result.interval,
                    repetitions: result.repetitions,
                    next_review: result.next_review,
                },
            });

            // Award XP and Update Streak (Centralized logic, same as the live review route)
            const stats = await userService.updateUserStats(userId, qualityGrade, userTz);
            totalXpEarned += stats.xpEarned;
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
