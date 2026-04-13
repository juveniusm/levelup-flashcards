import { useEffect } from "react";
import { Card } from "@/utils/study/studyUtils";

interface EndlessSessionData {
    queue: Card[];
    currentCard: Card;
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalCardsSeen: number;
    elapsedSeconds: number;
}

export function restoreEndlessSession(cards: Card[], storageKey: string): EndlessSessionData | null {
    try {
        const saved = sessionStorage.getItem(storageKey);
        if (!saved) return null;

        const parsed = JSON.parse(saved);
        if (!parsed.queueIds || parsed.queueIds.length === 0) return null;

        const savedIds = parsed.queueIds as string[];
        const allCardIds = new Set(cards.map(c => c.id));
        if (!savedIds.every(id => allCardIds.has(id))) {
            sessionStorage.removeItem(storageKey);
            return null;
        }

        const cardMap = new Map(cards.map(c => [c.id, c]));
        const restoredQueue = savedIds
            .map((id: string) => cardMap.get(id))
            .filter(Boolean) as Card[];

        if (restoredQueue.length === 0) return null;

        return {
            queue: restoredQueue,
            currentCard: restoredQueue[0],
            score: parsed.score ?? 0,
            correctAnswers: parsed.correctAnswers ?? 0,
            incorrectAnswers: parsed.incorrectAnswers ?? 0,
            totalCardsSeen: parsed.totalCardsSeen ?? 0,
            elapsedSeconds: parsed.elapsedSeconds ?? 0,
        };
    } catch (err) {
        console.error("Endless session restore error:", err);
        return null;
    }
}

export function useEndlessSessionPersist(
    storageKey: string,
    feedbackState: string,
    data: {
        queue: Card[];
        score: number;
        correctAnswers: number;
        incorrectAnswers: number;
        totalCardsSeen: number;
        elapsedSeconds: number;
    }
) {
    useEffect(() => {
        if (feedbackState === "finished") {
            sessionStorage.removeItem(storageKey);
            return;
        }
        sessionStorage.setItem(storageKey, JSON.stringify({
            queueIds: data.queue.map(c => c.id),
            score: data.score,
            correctAnswers: data.correctAnswers,
            incorrectAnswers: data.incorrectAnswers,
            totalCardsSeen: data.totalCardsSeen,
            elapsedSeconds: data.elapsedSeconds,
        }));
    }, [storageKey, feedbackState, data.queue, data.score, data.correctAnswers, data.incorrectAnswers, data.totalCardsSeen, data.elapsedSeconds]);
}
