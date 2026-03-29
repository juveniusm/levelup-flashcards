"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { evaluateAnswer } from "@/utils/cognitive/fuzzyMatch";
import { calculateQualityGrade } from "@/utils/cognitive/sm2";
import { Card, formatTime, shuffleArray } from "@/utils/study/studyUtils";
import Flashcard from "./Flashcard";
import SessionMetrics from "./SessionMetrics";
import SessionEndScreen from "./SessionEndScreen";
import StudyInputArea from "./StudyInputArea";

export default function EndlessInterface({
    cards,
    deckId,
}: {
    cards: Card[];
    deckId: string;
}) {
    const storageKey = `endless-session-${deckId}`;

    const getSavedSession = () => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                
                if (parsed.queueIds && parsed.queueIds.length > 0) {
                    const savedIds = parsed.queueIds as string[];
                    
                    // Simple validation: check if the first card ID from saved queue still exists in current cards
                    // to prevent resuming a session with a completely different deck
                    const allCardIds = new Set(cards.map(c => c.id));
                    const isSessionStillValid = savedIds.every(id => allCardIds.has(id));

                    if (!isSessionStillValid) {
                        console.log("Endless session invalid for current deck, clearing.");
                        sessionStorage.removeItem(storageKey);
                        return null;
                    }

                    const cardMap = new Map(cards.map((c) => [c.id, c]));
                    const restoredQueue = savedIds
                        .map((id: string) => cardMap.get(id))
                        .filter(Boolean) as Card[];

                    if (restoredQueue.length > 0) {
                        return {
                            queue: restoredQueue,
                            currentCard: restoredQueue[0],
                            score: parsed.score ?? 0,
                            correctAnswers: parsed.correctAnswers ?? 0,
                            incorrectAnswers: parsed.incorrectAnswers ?? 0,
                            totalCardsSeen: parsed.totalCardsSeen ?? 0,
                            elapsedSeconds: parsed.elapsedSeconds ?? 0,
                        };
                    }
                }
            }
        } catch (err) {
            console.error("Endless session restore error:", err);
        }
        return null;
    };

    const saved = getSavedSession();

    // Dynamic card queue
    const [queue, setQueue] = useState<Card[]>(saved?.queue ?? [...cards]);
    const [currentCard, setCurrentCard] = useState<Card>(saved?.currentCard ?? cards[0]);

    const [inputAnswer, setInputAnswer] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(saved?.elapsedSeconds ?? 0);

    // Game stats
    const [score, setScore] = useState(saved?.score ?? 0);
    const [correctAnswers, setCorrectAnswers] = useState(saved?.correctAnswers ?? 0);
    const [incorrectAnswers, setIncorrectAnswers] = useState(saved?.incorrectAnswers ?? 0);
    const [totalCardsSeen, setTotalCardsSeen] = useState(saved?.totalCardsSeen ?? 0);
    const [xpEarned, setXpEarned] = useState(0);
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);

    // UI state
    const [feedbackState, setFeedbackState] = useState<"question" | "feedback_correct" | "feedback_incorrect" | "finished">("question");
    const [lastInputAnswer, setLastInputAnswer] = useState("");

    // Persist session
    useEffect(() => {
        if (feedbackState === "finished") {
            sessionStorage.removeItem(storageKey);
            return;
        }
        sessionStorage.setItem(storageKey, JSON.stringify({
            queueIds: queue.map((c) => c.id),
            score,
            correctAnswers,
            incorrectAnswers,
            totalCardsSeen,
            elapsedSeconds,
        }));
    }, [queue, score, correctAnswers, incorrectAnswers, totalCardsSeen, elapsedSeconds, feedbackState, storageKey]);

    const clearSessionAndReload = () => {
        sessionStorage.removeItem(storageKey);
        window.location.reload();
    };

    // Timer
    useEffect(() => {
        if (feedbackState === "finished") return;
        const interval = setInterval(() => {
            setElapsedSeconds((prev: number) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [feedbackState]);

    // Auto-focus input
    useEffect(() => {
        if (feedbackState === "question" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [feedbackState]);

    const advanceQueue = useCallback((wasIncorrect: boolean, failedCard?: Card) => {
        setQueue((prevQueue) => {
            let newQueue = prevQueue.slice(1);

            if (wasIncorrect && failedCard) {
                const insertPos = Math.min(
                    3 + Math.floor(Math.random() * 3),
                    newQueue.length,
                );
                newQueue = [
                    ...newQueue.slice(0, insertPos),
                    failedCard,
                    ...newQueue.slice(insertPos),
                ];
            }

            if (newQueue.length < 3) {
                newQueue = [...newQueue, ...shuffleArray(cards)];
            }

            setCurrentCard(newQueue[0]);
            return newQueue;
        });
    }, [cards]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputAnswer.trim()) {
            handlePass();
            return;
        }

        const fuzzyScore = evaluateAnswer(inputAnswer, currentCard.back);
        const quality = calculateQualityGrade(fuzzyScore);

        const isCorrect = quality >= 4;
        const isPerfect = quality === 5;

        setTotalCardsSeen((prev: number) => prev + 1);
        setLastInputAnswer(inputAnswer);

        if (isCorrect) {
            setScore((prev: number) => prev + (isPerfect ? 10 : 5));
            setCorrectAnswers((prev: number) => prev + 1);
            setFeedbackState("feedback_correct");
        } else {
            setScore((prev: number) => Math.max(0, prev - 3));
            setIncorrectAnswers((prev: number) => prev + 1);
            setFeedbackState("feedback_incorrect");
        }

        fetch(`/api/decks/${deckId}/cards/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cardId: currentCard.id,
                qualityGrade: quality,
                isReviewMode: false,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.xpEarned) setXpEarned((prev) => prev + data.xpEarned);
            })
            .catch((err) => console.error("Failed to save review:", err));
    };

    const handlePass = () => {
        setTotalCardsSeen((prev: number) => prev + 1);
        setScore((prev: number) => Math.max(0, prev - 3));
        setIncorrectAnswers((prev: number) => prev + 1);
        setInputAnswer("");
        setLastInputAnswer("(Passed)");

        // Send SRS update (quality 0 = mistake/forgotten)
        fetch(`/api/decks/${deckId}/cards/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cardId: currentCard.id,
                qualityGrade: 0,
                isReviewMode: false,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }),
        })
            .then((res) => res.json())
            .catch((err) => console.error("Failed to save review:", err));

        setFeedbackState("feedback_incorrect");
    };

    const handleNext = () => {
        const wasIncorrect = feedbackState === "feedback_incorrect";
        setInputAnswer("");
        advanceQueue(wasIncorrect, wasIncorrect ? currentCard : undefined);
        setFeedbackState("question");
    };

    if (cards.length === 0) {
        return (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-white mb-4">No Cards</h2>
                <p className="text-neutral-400">Add cards to this deck before studying.</p>
            </div>
        );
    }

    // Finished screen
    if (feedbackState === "finished") {
        return (
            <SessionEndScreen
                title="Session Over"
                titleColorClass="text-[#f9c111]"
                subtitle={
                    <>
                        You studied for <span className="text-white font-bold">{formatTime(elapsedSeconds)}</span>
                    </>
                }
                primaryButtonLabel="Play Again"
                onPrimaryClick={clearSessionAndReload}
            >
                <SessionMetrics
                    score={score}
                    correctAnswers={correctAnswers}
                    incorrectAnswers={incorrectAnswers}
                    totalCardsSeen={totalCardsSeen}
                    xpEarned={xpEarned}
                />
            </SessionEndScreen>
        );
    }

    const feedbackType = feedbackState === "feedback_correct"
        ? "correct" as const
        : feedbackState === "feedback_incorrect"
            ? "incorrect" as const
            : null;

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* HUD */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8 border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                        <span className="text-white">{formatTime(elapsedSeconds)}</span>
                    </div>
                    <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                        CARDS <span className="text-[#f9c111]">{totalCardsSeen}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-xl font-bold font-mono tracking-widest text-white">
                        SCORE <span className="text-[#f9c111]">{score.toString().padStart(4, "0")}</span>
                    </div>
                    <button
                        onClick={() => setFeedbackState("finished")}
                        className="text-sm font-bold text-neutral-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-neutral-700 hover:border-red-400/50 px-4 py-2 rounded-lg"
                    >
                        End
                    </button>
                </div>
            </div>

            <Flashcard
                card={currentCard}
                isFlipped={feedbackType !== null}
                label="Endless Mode"
                feedbackType={feedbackType}
                feedbackExtra="(-3)"
                userAnswer={lastInputAnswer}
                onEnlargeChange={setIsImageEnlarged}
            />

            {/* Input Area */}
            <StudyInputArea
                isImageEnlarged={isImageEnlarged}
                stateValue={feedbackState}
                inputRef={inputRef}
                inputAnswer={inputAnswer}
                onInputChange={setInputAnswer}
                onSubmit={handleSubmit}
                onPass={handlePass}
                onNext={handleNext}
            />
        </div>
    );
}
