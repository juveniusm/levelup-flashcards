import { useCallback } from "react";
import { db } from "@/lib/indexedDB";

interface ReviewPayload {
    cardId: string;
    qualityGrade: number;
    isReviewMode: boolean;
}

export function useStudyReview(deckId: string, setXpEarned?: React.Dispatch<React.SetStateAction<number>>) {
    const submitReview = useCallback(
        async ({ cardId, qualityGrade, isReviewMode }: ReviewPayload) => {
            const timestamp = Date.now();
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Give the user optimistic local XP instantly
            const isCorrect = qualityGrade >= 3;
            const optimisticXp = isCorrect ? 10 : 3;
            if (setXpEarned) {
                setXpEarned((prev) => prev + optimisticXp);
            }

            if (!navigator.onLine) {
                console.log("Offline mode: Queueing review in local Dexie outbox.");
                await db.reviewOutbox.put({
                    deckId,
                    cardId,
                    qualityGrade,
                    isReviewMode,
                    timestamp,
                });
                return;
            }

            try {
                // Notice we now point the individual live review to the new Sync API passing a single-item array
                const res = await fetch(`/api/decks/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reviews: [{
                            deckId,
                            cardId,
                            qualityGrade,
                            isReviewMode,
                            timestamp
                        }],
                        timezone,
                    }),
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        console.warn("Auth expired! Safely queuing to Dexie.");
                        // Keep in local DB if unauthorized so it stays safe
                        await db.reviewOutbox.put({ deckId, cardId, qualityGrade, isReviewMode, timestamp });
                    }
                    console.error("Review API error:", res.status);
                    return;
                }
            } catch (err) {
                console.warn("Network error during review. Queueing securely to Dexie.", err);
                await db.reviewOutbox.put({ deckId, cardId, qualityGrade, isReviewMode, timestamp });
            }
        },
        [deckId, setXpEarned]
    );

    return { submitReview };
}
