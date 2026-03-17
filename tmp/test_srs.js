
const { calculateSM2 } = require('./src/utils/cognitive/sm2');

function test() {
    console.log("Testing SM2 Logic Improvements...\n");

    const timezone = "Asia/Jakarta"; // GMT+7
    const prevEase = 2.5;
    const prevReps = 0;
    const quality = 5; // Perfect

    // 1. Test first repetition interval growth (should be 1 day)
    const res1 = calculateSM2(quality, prevReps, prevEase, timezone);
    console.log("Step 1 (First Rep):", res1);
    console.log("Next Review (Localized):", res1.next_review.toLocaleString("en-US", { timeZone: timezone }));

    // 2. Test second repetition (should be 3 days)
    const res2 = calculateSM2(quality, 1, 2.6, timezone);
    console.log("\nStep 2 (Second Rep):", res2);
    console.log("Next Review (Localized):", res2.next_review.toLocaleString("en-US", { timeZone: timezone }));

    // 3. Test failed review (should reset to 1 day and 0 reps)
    const resFail = calculateSM2(2, 5, 2.8, timezone);
    console.log("\nStep 3 (Failed Rep):", resFail);
    console.log("Next Review (Localized):", resFail.next_review.toLocaleString("en-US", { timeZone: timezone }));

    // Verify 4 AM reset
    const hours = new Date(res1.next_review.toLocaleString("en-US", { timeZone: timezone })).getHours();
    console.log("\nReview Hour in Local Time:", hours);
    if (hours === 4) {
        console.log("Success: Reset time is correctly set to 4 AM.");
    } else {
        console.log("Failure: Reset time is NOT 4 AM.");
    }
}

// Mocking required parts since this is running in a different environment
global.Intl = Intl;

test();
