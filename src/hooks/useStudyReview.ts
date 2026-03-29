import { useCallback } from "react";

interface ReviewPayload {
    cardId: string;
    qualityGrade: number;
    isReviewMode: boolean;
}

export function useStudyReview(deckId: string, setXpEarned?: React.Dispatch<React.SetStateAction<number>>) {
    const submitReview = useCallback(
        async ({ cardId, qualityGrade, isReviewMode }: ReviewPayload) => {
            try {
                const res = await fetch(`/api/decks/${deckId}/cards/review`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cardId,
                        qualityGrade,
                        isReviewMode,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    }),
                });

                const data = await res.json();
                if (data.xpEarned && setXpEarned) {
                    setXpEarned((prev) => prev + data.xpEarned);
                }
            } catch (err) {
                console.error("Failed to save review:", err);
            }
        },
        [deckId, setXpEarned]
    );

    return { submitReview };
}
