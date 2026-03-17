
// Standalone logic check for SM2 improvements
function calculateSM2(
    qualityGrade,
    repetitions,
    previousEaseFactor,
    timezone
) {
    let newEaseFactor = previousEaseFactor;
    let newRepetitions = repetitions;

    // Fixed interval schedule (progressive growth)
    const INTERVAL_STEPS = [1, 3, 7, 14, 30, 90];

    let newInterval;

    if (qualityGrade < 3) {
        newRepetitions = 0;
        newInterval = 1;
    } else {
        newRepetitions = repetitions + 1;
        const stepIndex = Math.min(newRepetitions - 1, INTERVAL_STEPS.length - 1);
        newInterval = INTERVAL_STEPS[stepIndex];
    }

    newEaseFactor =
        previousEaseFactor +
        (0.1 - (5 - qualityGrade) * (0.08 + (5 - qualityGrade) * 0.02));

    if (newEaseFactor < 1.3) {
        newEaseFactor = 1.3;
    }

    let nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    if (timezone) {
        try {
            const dateFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const dateStr = dateFormatter.format(nextReviewDate);

            const offsetFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'longOffset'
            });
            const parts = offsetFormatter.formatToParts(nextReviewDate);
            const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value;
            const tzOffset = offsetPart ? offsetPart.replace('GMT', '') : 'Z';

            const isoString = `${dateStr}T04:00:00${tzOffset || 'Z'}`;
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

function test() {
    console.log("Verifying SRS Logic Enhancements...\n");

    const timezone = "Asia/Jakarta"; // GMT+7
    const quality = 5;

    // 1. Initial review
    const r1 = calculateSM2(quality, 0, 2.5, timezone);
    console.log("Rep 1:", r1.interval, "days, next review:", r1.next_review.toISOString());
    console.log("Local time:", r1.next_review.toLocaleString("en-GB", { timeZone: timezone }));
    
    // 2. Second review (should be 3 days)
    const r2 = calculateSM2(quality, 1, 2.6, timezone);
    console.log("\nRep 2:", r2.interval, "days, next review:", r2.next_review.toISOString());
    console.log("Local time:", r2.next_review.toLocaleString("en-GB", { timeZone: timezone }));

    // 3. Third review (should be 7 days)
    const r3 = calculateSM2(quality, 2, 2.7, timezone);
    console.log("\nRep 3:", r3.interval, "days, next review:", r3.next_review.toISOString());
    
    // Verify 4 AM
    const localHour = new Date(r1.next_review.toLocaleString("en-US", { timeZone: timezone })).getHours();
    console.log("\nNormalized Hour (Target 4 AM):", localHour);
    
    if (r1.interval === 1 && r2.interval === 3 && r3.interval === 7 && localHour === 4) {
        console.log("\n✅ ALL TESTS PASSED: Intervals correctly skip and reset time is 4 AM.");
    } else {
        console.log("\n❌ TEST FAILED: Verification logic check failed.");
    }
}

test();
