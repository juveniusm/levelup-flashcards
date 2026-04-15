import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateSM2 } from "@/utils/cognitive/sm2";

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

        const todayDateStr = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone || "UTC"
        }).format(new Date());

        let totalXpEarned = 0;

        // Ensure chronological order
        const sortedReviews = [...reviews].sort((a, b) => a.timestamp - b.timestamp);

        // We run these sequentially to ensure Last-Write-Wins logic resolves perfectly against fresh Postgres state
        for (const review of sortedReviews) {
            const { cardId, qualityGrade, isReviewMode, timestamp } = review;
            const reviewTime = new Date(timestamp);

            const isCorrect = qualityGrade >= 3;
            // Simplified XP: +10 correct, +3 incorrect
            const xpEarned = isCorrect ? 10 : 3;

            // Log the study event history regardless of LWW
            await prisma.study_history.create({
                data: {
                    user_id: userId,
                    card_id: cardId,
                    quality: qualityGrade,
                    reviewed_at: reviewTime,
                }
            });

            if (!isReviewMode) {
                // If not reviewing, no SM2 update needed, but XP is earned
                await prisma.daily_study_stats.upsert({
                    where: { user_id_date: { user_id: userId, date: todayDateStr } },
                    update: { xp_earned: { increment: xpEarned } },
                    create: { user_id: userId, date: todayDateStr, xp_earned: xpEarned }
                });
                await prisma.user.update({
                    where: { id: userId },
                    data: { total_xp: { increment: xpEarned } }
                });
                totalXpEarned += xpEarned;
                continue;
            }

            // SM2 Update Logic (LWW Gatekeeper)
            const currentStats = await prisma.sM2Stats.findUnique({
                where: { user_id_card_id: { user_id: userId, card_id: cardId } }
            });

            const currentLastReviewedAt = currentStats?.last_reviewed_at;
            
            // The LWW Gatekeeper!
            // If the database has a record newer than the offline sync payload, DROP the interval update!
            if (currentLastReviewedAt && currentLastReviewedAt > reviewTime) {
                console.log(`LWW: Ignored stale review for card ${cardId}`);
                continue;
            }

            const currentEase = currentStats?.ease_factor ?? 2.5;
            const currentInterval = currentStats?.interval ?? 0;
            const currentReps = currentStats?.repetitions ?? 0;

            const { easeFactor, interval, repetitions } = calculateSM2(
                qualityGrade,
                currentReps,
                currentEase,
                currentInterval
            );

            const nextReview = new Date(reviewTime);
            nextReview.setDate(nextReview.getDate() + interval);

            await prisma.sM2Stats.upsert({
                where: { user_id_card_id: { user_id: userId, card_id: cardId } },
                update: {
                    ease_factor: easeFactor,
                    interval,
                    repetitions,
                    next_review: nextReview,
                    last_reviewed_at: reviewTime,
                },
                create: {
                    user_id: userId,
                    card_id: cardId,
                    ease_factor: easeFactor,
                    interval,
                    repetitions,
                    next_review: nextReview,
                    last_reviewed_at: reviewTime,
                }
            });

            // Update daily stats and total XP
            let dailyUpdateData: any = { xp_earned: { increment: xpEarned } };
            if (isCorrect) {
                dailyUpdateData.correct_reviews = { increment: 1 };
            } else {
                dailyUpdateData.incorrect_reviews = { increment: 1 };
            }

            await prisma.daily_study_stats.upsert({
                where: { user_id_date: { user_id: userId, date: todayDateStr } },
                update: dailyUpdateData,
                create: {
                    user_id: userId,
                    date: todayDateStr,
                    xp_earned: xpEarned,
                    correct_reviews: isCorrect ? 1 : 0,
                    incorrect_reviews: isCorrect ? 0 : 1,
                }
            });

            await prisma.user.update({
                where: { id: userId },
                data: { total_xp: { increment: xpEarned } }
            });

            totalXpEarned += xpEarned;
        }

        return NextResponse.json({ success: true, totalXpEarned });

    } catch (error) {
        console.error("Sync API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
