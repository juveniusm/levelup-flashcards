import prisma from "@/lib/prisma";
import type { SM2Stats } from "@prisma/client";
import { calculateSM2 } from "@/utils/cognitive/sm2";
import { userService } from "@/lib/services/userService";

interface ProcessReviewInput {
    userId: string;
    /** Server-fetched card whose access the caller has already verified. Only deck_id is read. */
    card: { deck_id: string };
    cardId: string;
    qualityGrade: number;
    isReviewMode: boolean;
    /** Already normalized (caller runs normalizeTimezone). */
    userTz: string;
    /** When the review happened: live = now; sync = the (future-clamped) client timestamp. */
    reviewTime: Date;
}

interface ProcessReviewOptions {
    /**
     * Persist `reviewTime` on the ReviewLog (offline sync). The live route omits this so the
     * column falls back to its default (now).
     */
    persistReviewedAt?: boolean;
    /**
     * Always advance the schedule (interval / repetitions / next_review). Used by sync. The live
     * route advances conditionally — only on a "real" review (review mode, the card was due, or
     * the user studied ahead and got it right) — otherwise it nudges only the ease factor.
     */
    alwaysAdvanceSchedule?: boolean;
    /**
     * Run the last-write-wins gatekeeper: if a newer ReviewLog already exists for this card, skip
     * the SM2 update and the XP/streak grant (the ReviewLog is still written, for analytics).
     * Used by sync to resolve offline batches against fresher online state.
     */
    enforceLastWriteWins?: boolean;
}

export interface ProcessReviewResult {
    /** True when the LWW gatekeeper skipped the SM2 update + XP/streak (sync only). */
    skipped: boolean;
    /** The upserted SM2Stats row. Undefined when skipped. */
    sm2?: SM2Stats;
    /** XP/streak result from updateUserStats. Undefined when skipped. */
    stats?: { xpEarned: number; totalXp: number; currentStreak: number };
}

export const reviewService = {
    /**
     * Shared SM-2 + ReviewLog + XP/streak pipeline used by the live review route and the offline
     * sync route. The caller is responsible for authentication, body validation, card fetch +
     * access check, and (for sync) timestamp clamping and looping.
     *
     * Operation order (single, for both routes): XP dedupe check → ReviewLog create → load SM2
     * stats → LWW gatekeeper (optional) → SM2 upsert → updateUserStats.
     */
    async processReview(
        input: ProcessReviewInput,
        options: ProcessReviewOptions = {}
    ): Promise<ProcessReviewResult> {
        const { userId, card, cardId, qualityGrade, isReviewMode, userTz, reviewTime } = input;
        const {
            persistReviewedAt = false,
            alwaysAdvanceSchedule = false,
            enforceLastWriteWins = false,
        } = options;

        // Anti-farm: award XP for a given card at most once per local day. Checked BEFORE this
        // review's ReviewLog is written, so the current review is not counted. Fail open (award
        // XP) on any error so a transient issue never blocks study or zeroes legitimate XP.
        let awardXp = true;
        try {
            awardXp = !(await userService.hasReviewedCardOnDay(userId, cardId, reviewTime, userTz));
        } catch (e) {
            console.warn("processReview: XP dedupe check failed; awarding XP:", e);
        }

        // Log the review event. deck_id is taken from the server-verified card, never the client.
        await prisma.reviewLog.create({
            data: {
                user_id: userId,
                card_id: cardId,
                deck_id: card.deck_id,
                quality_grade: qualityGrade,
                mode: isReviewMode === true ? "review" : "study",
                ...(persistReviewedAt ? { reviewed_at: reviewTime } : {}),
            },
        });

        const existing = await prisma.sM2Stats.findUnique({
            where: { card_id_user_id: { card_id: cardId, user_id: userId } },
        });

        // LWW gatekeeper: a more recent review may already have been processed online. The
        // ReviewLog just written has reviewed_at === reviewTime and the check is `gt`, so it never
        // matches itself.
        if (enforceLastWriteWins) {
            const newerLog = await prisma.reviewLog.findFirst({
                where: {
                    user_id: userId,
                    card_id: cardId,
                    reviewed_at: { gt: reviewTime },
                },
            });
            if (newerLog) {
                console.log(`LWW: Ignored stale SM2 update for card ${cardId}`);
                return { skipped: true };
            }
        }

        const prevEase = existing?.ease_factor ?? 2.5;
        const prevReps = existing?.repetitions ?? 0;
        const result = calculateSM2(qualityGrade, prevReps, prevEase, userTz);

        const isDue = !!existing && existing.next_review <= reviewTime;
        const isCorrectEarly = qualityGrade >= 4;
        const advanceSchedule = alwaysAdvanceSchedule || isReviewMode === true || isDue || isCorrectEarly;

        // A "real" review advances interval/reps/next_review; otherwise only the ease factor moves
        // (reward studying ahead without prematurely rescheduling the card).
        const updateData = advanceSchedule
            ? {
                ease_factor: result.ease_factor,
                interval: result.interval,
                repetitions: result.repetitions,
                next_review: result.next_review,
            }
            : {
                ease_factor: result.ease_factor,
            };

        const sm2 = await prisma.sM2Stats.upsert({
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

        const stats = await userService.updateUserStats(userId, qualityGrade, userTz, awardXp);

        return { skipped: false, sm2, stats };
    },
};
