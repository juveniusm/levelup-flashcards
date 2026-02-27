import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { calculateSM2 } from "@/utils/cognitive/sm2";
import { calculateXpForReview } from "@/utils/xp/xpUtils";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const { cardId, qualityGrade, isReviewMode, timezone } = await request.json();

        // Default to UTC if no timezone provided (fallback)
        const userTz = timezone || 'UTC';

        if (typeof cardId !== "string" || typeof qualityGrade !== "number") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Get existing SM2 stats and card info in parallel
        const [existing, card] = await Promise.all([
            prisma.sM2Stats.findUnique({
                where: { card_id_user_id: { card_id: cardId, user_id: userId } },
            }),
            prisma.cards.findUnique({
                where: { id: cardId },
                include: {
                    deck: {
                        select: {
                            id: true,
                            user_id: true,
                            user: { select: { role: true } }
                        }
                    }
                }
            })
        ]);

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // --- SECURITY CHECK: Ensure user owns the deck OR it is an Admin deck ---
        const isOwner = card.deck.user_id === userId;
        const isAdminDeck = card.deck.user.role === "ADMIN";

        if (!isOwner && !isAdminDeck) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const prevEase = existing?.ease_factor ?? 2.5;
        const prevReps = existing?.repetitions ?? 0;

        // Run the SM2 algorithm (passing the timezone for normalization)
        const result = calculateSM2(qualityGrade, prevReps, prevEase, userTz);

        // If explicitly reviewing, update intervals and next_review dates.
        // Otherwise (Study Mode, Endless Mode), ONLY adjust ease_factor to reflect understanding
        // without ruining the standard scheduled spaced-repetition timeline.
        const isDue = existing && existing.next_review <= new Date();

        const updateData = (isReviewMode === true || isDue)
            ? {
                ease_factor: result.ease_factor,
                interval: result.interval,
                repetitions: result.repetitions,
                next_review: result.next_review,
            }
            : {
                ease_factor: result.ease_factor,
                // Do not update SRS schedule if practicing a non-due card
            };

        const createData = {
            card_id: cardId,
            user_id: userId,
            ease_factor: result.ease_factor,
            interval: result.interval,
            repetitions: result.repetitions,
            next_review: result.next_review,
        };

        // Upsert the SM2 stats record
        const updated = await prisma.sM2Stats.upsert({
            where: { card_id_user_id: { card_id: cardId, user_id: userId } },
            update: updateData,
            create: createData,
        });

        // Log the review event for statistics
        await prisma.reviewLog.create({
            data: {
                user_id: userId,
                card_id: cardId,
                deck_id: card.deck_id,
                quality_grade: qualityGrade,
                mode: isReviewMode === true ? "review" : "study",
            },
        });

        // --- STREAK LOGIC ---
        // 1. Get user's last review before this one
        const lastReview = await prisma.reviewLog.findFirst({
            where: { user_id: userId, NOT: { id: undefined } }, // Just a safety check
            orderBy: { reviewed_at: 'desc' },
            skip: 1, // Skip the one we just created
        });

        const now = new Date();
        const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: userTz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const todayStr = dateFormatter.format(now);

        let streakIncrement = 0;
        let setStreakTo = undefined;

        if (!lastReview) {
            // First review ever
            setStreakTo = 1;
        } else {
            const lastDateStr = dateFormatter.format(lastReview.reviewed_at);

            if (todayStr === lastDateStr) {
                // Already reviewed today, keep streak same
            } else {
                // Check if yesterday
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = dateFormatter.format(yesterday);

                if (lastDateStr === yesterdayStr) {
                    streakIncrement = 1;
                } else {
                    // Missed a day
                    setStreakTo = 1;
                }
            }
        }

        // Award XP and Update Streak
        const xpEarned = calculateXpForReview(qualityGrade);

        const userStats = await prisma.userStats.upsert({
            where: { user_id: userId },
            update: {
                total_xp: { increment: xpEarned },
                ...(setStreakTo !== undefined ? { current_streak: setStreakTo } : {}),
                ...(streakIncrement > 0 ? { current_streak: { increment: streakIncrement } } : {}),
            },
            create: {
                user_id: userId,
                total_xp: xpEarned,
                current_streak: 1
            },
        });

        const totalXp = userStats.total_xp;
        const currentStreak = userStats.current_streak;

        return NextResponse.json({ success: true, stats: updated, xpEarned, totalXp, currentStreak });
    } catch (error) {
        console.error("Review API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
