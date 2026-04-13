import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { userService } from "@/lib/services/userService";
import prisma from "@/lib/prisma";
import { calculateSM2 } from "@/utils/cognitive/sm2";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cardId, qualityGrade, isReviewMode, timezone } = await request.json();
        const userTz = timezone || 'UTC';

        if (typeof cardId !== "string" || typeof qualityGrade !== "number" || qualityGrade < 0 || qualityGrade > 5) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Get existing SM2 stats and card info
        const [existing, card] = await Promise.all([
            prisma.sM2Stats.findUnique({
                where: { card_id_user_id: { card_id: cardId, user_id: user.id } },
            }),
            prisma.cards.findUnique({
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
            })
        ]);

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // Security check
        const isOwner = card.deck.user_id === user.id;
        const isPublicDeck = card.deck.is_public === true;

        if (!isOwner && !isPublicDeck) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const prevEase = existing?.ease_factor ?? 2.5;
        const prevReps = existing?.repetitions ?? 0;

        const result = calculateSM2(qualityGrade, prevReps, prevEase, userTz);
        const isDue = existing && existing.next_review <= new Date();
        const isCorrectEarly = qualityGrade >= 4;

        // Update interval/reps/next_review if it's a "real" review (due) 
        // OR if the user is studying early and gets it right (reward study ahead).
        const updateData = (isReviewMode === true || isDue || isCorrectEarly)
            ? {
                ease_factor: result.ease_factor,
                interval: result.interval,
                repetitions: result.repetitions,
                next_review: result.next_review,
            }
            : {
                ease_factor: result.ease_factor,
            };

        const createData = {
            card_id: cardId,
            user_id: user.id,
            ease_factor: result.ease_factor,
            interval: result.interval,
            repetitions: result.repetitions,
            next_review: result.next_review,
        };

        // Upsert SM2 stats
        const updated = await prisma.sM2Stats.upsert({
            where: { card_id_user_id: { card_id: cardId, user_id: user.id } },
            update: updateData,
            create: createData,
        });

        // Log review event
        await prisma.reviewLog.create({
            data: {
                user_id: user.id,
                card_id: cardId,
                deck_id: card.deck_id,
                quality_grade: qualityGrade,
                mode: isReviewMode === true ? "review" : "study",
            },
        });

        // Award XP and Update Streak (Centralized logic)
        const stats = await userService.updateUserStats(user.id, qualityGrade, userTz);

        return NextResponse.json({
            success: true,
            stats: updated,
            ...stats
        });
    } catch (error) {
        console.error("Review API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
