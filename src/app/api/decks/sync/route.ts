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
            const reviewTime = new Date(timestamp);

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
            // Check if the existing SM2 record was updated AFTER this offline review was created.
            // If so, the offline review is stale — skip the SM2/interval update but keep the ReviewLog above.
            if (existing?.next_review && existing.next_review > reviewTime) {
                // A more recent review has already been processed online.
                // We logged it above for history, but we do NOT touch SM2 multipliers.
                console.log(`LWW: Ignored stale SM2 update for card ${cardId}`);
                continue;
            }

            const prevEase = existing?.ease_factor ?? 2.5;
            const prevReps = existing?.repetitions ?? 0;

            const result = calculateSM2(qualityGrade, prevReps, prevEase, userTz);
            const isDue = existing && existing.next_review <= new Date();
            const isCorrectEarly = qualityGrade >= 4;

            const updateData = (isReviewMode || isDue || isCorrectEarly)
                ? {
                    ease_factor: result.ease_factor,
                    interval: result.interval,
                    repetitions: result.repetitions,
                    next_review: result.next_review,
                }
                : {
                    ease_factor: result.ease_factor,
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

    } catch (error) {
        console.error("Sync API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
