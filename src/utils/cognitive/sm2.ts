/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation
 */

export interface SM2Result {
    ease_factor: number;
    interval: number;
    repetitions: number;
    next_review: Date;
}

/**
 * Derives a quality grade (0 to 5) from the user's fuzzy typing score.
 * 
 * Score Map:
 * - 0: Complete blackout (score < 0.2)
 * - 1: Incorrect, but remembered later (score < 0.4)
 * - 2: Incorrect, but seemed easy to recall (score < 0.6)
 * - 3: Correct, but required significant difficulty (score < 0.8)
 * - 4: Correct after hesitation (score < 0.95)
 * - 5: Perfect response (score >= 0.95)
 */
export function calculateQualityGrade(fuzzyScore: number): number {
    if (fuzzyScore >= 0.95) return 5;
    if (fuzzyScore >= 0.80) return 4;
    if (fuzzyScore >= 0.60) return 3;
    if (fuzzyScore >= 0.40) return 2;
    if (fuzzyScore >= 0.20) return 1;
    return 0; // complete failure
}

/**
 * Executes the SM-2 algorithm logic to determine the next review date
 * based on the quality of the current review.
 */
export function calculateSM2(
    qualityGrade: number,
    repetitions: number,
    previousEaseFactor: number,
    timezone?: string
): SM2Result {
    let newEaseFactor = previousEaseFactor;
    let newRepetitions = repetitions;

    // Fixed interval schedule (capped at 28 days)
    const INTERVAL_STEPS = [1, 2, 5, 7, 14, 28];

    let newInterval: number;

    // Grade < 3 means the user "failed" the card.
    if (qualityGrade < 3) {
        newRepetitions = 0;
        newInterval = 1; // reset to 1 day
    } else {
        // User passed the card
        newRepetitions = repetitions + 1;

        // Use the fixed schedule, capping at the last step (28 days)
        const stepIndex = Math.min(newRepetitions - 1, INTERVAL_STEPS.length - 1);
        newInterval = INTERVAL_STEPS[stepIndex];
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor =
        previousEaseFactor +
        (0.1 - (5 - qualityGrade) * (0.08 + (5 - qualityGrade) * 0.02));

    // Enforce absolute floor for EF = 1.3
    if (newEaseFactor < 1.3) {
        newEaseFactor = 1.3;
    }

    // Determine next review date
    let nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Normalize to 00:00:00 in the user's local timezone if provided
    if (timezone) {
        try {
            // 1. Get the YYYY-MM-DD for the target day in the user's timezone
            const dateFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const dateStr = dateFormatter.format(nextReviewDate); // "YYYY-MM-DD"

            // 2. Get the timezone offset string (e.g., "+07:00" or "-05:00")
            const offsetFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'longOffset'
            });
            const parts = offsetFormatter.formatToParts(nextReviewDate);
            const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value; // "GMT+07:00"
            const tzOffset = offsetPart ? offsetPart.replace('GMT', '') : 'Z';

            // 3. Construct the ISO string for midnight in that timezone and parse it
            // This creates a Date object that represents the exact UTC moment of local midnight.
            const isoString = `${dateStr}T00:00:00${tzOffset || 'Z'}`;
            nextReviewDate = new Date(isoString);
        } catch (e) {
            console.error("Failed to normalize date for timezone:", timezone, e);
        }
    }

    return {
        ease_factor: Number(newEaseFactor.toFixed(3)),
        interval: newInterval,
        repetitions: newRepetitions,
        next_review: nextReviewDate,
    };
}
