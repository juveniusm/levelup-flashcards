"use client";

import { useMachine } from "@xstate/react";
import { classicModeMachine } from "@/machines/classicModeMachine";
import { useState, useRef, useEffect, useCallback } from "react";
import { evaluateAnswer } from "@/utils/cognitive/fuzzyMatch";
import { calculateQualityGrade } from "@/utils/cognitive/sm2";
import { Card } from "@/utils/study/studyUtils";
import Flashcard from "./Flashcard";
import SessionMetrics from "./SessionMetrics";
import StudyInputArea from "./StudyInputArea";
import StudyHUD from "./StudyHUD";
import { useStudyReview } from "@/hooks/useStudyReview";
import ClassicModeEndScreen from "./ClassicModeEndScreen";

export default function StudyInterface({
    cards,
    deckId,
    mode = "study",
    isReviewMode = false,
}: {
    cards: Card[];
    deckId: string;
    mode?: string;
    isReviewMode?: boolean;
}) {
    const storageKey = `study-session-${deckId}-${mode}`;

    const getSavedState = () => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);

                // Validation: Ensure card set still matches
                if (parsed.context && parsed.context.cardIds) {
                    // Check if the current cards match the saved IDs (order and set)
                    const currentIds = cards.map(c => c.id);
                    const savedIds = parsed.context.cardIds as string[];

                    const isCardSetIdentical = currentIds.length === savedIds.length && 
                        currentIds.every((id, idx) => id === savedIds[idx]);

                    if (!isCardSetIdentical) {
                        console.log("Card set changed, discarding saved session state.");
                        sessionStorage.removeItem(storageKey);
                        // Fall through to return fresh state at the end
                    } else {
                        const cardMap = new Map(cards.map(c => [c.id, c]));

                        // Reconstruct the ordered array based on saved IDs
                        const restoredOrder = savedIds
                            .map((id: string) => cardMap.get(id))
                            .filter(Boolean) as Card[];

                        if (restoredOrder.length > 0) {
                            // Adjust currentIndex if it's now out of bounds
                            const safeIndex = Math.min(parsed.context.currentIndex, restoredOrder.length - 1);

                            return classicModeMachine.resolveState({
                                value: parsed.stateValue,
                                context: {
                                    ...parsed.context,
                                    cards: restoredOrder,
                                    currentIndex: safeIndex,
                                },
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Session restore error:", err);
        }
        return classicModeMachine.resolveState({
            value: "question",
            context: {
                cards,
                currentIndex: 0,
                lives: 5,
                score: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                gameStatus: "playing",
            },
        });
    };

    const [state, send] = useMachine(classicModeMachine, {
        state: getSavedState(),
    });

    // Persist playing state to sessionStorage
    useEffect(() => {
        const { context } = state;
        if (context.gameStatus === "playing") {
            sessionStorage.setItem(storageKey, JSON.stringify({
                stateValue: state.value,
                context: {
                    currentIndex: context.currentIndex,
                    lives: context.lives,
                    score: context.score,
                    correctAnswers: context.correctAnswers,
                    incorrectAnswers: context.incorrectAnswers,
                    gameStatus: context.gameStatus,
                    cardIds: context.cards.map((c: Card) => c.id), // Only save IDs
                },
            }));
        } else {
            sessionStorage.removeItem(storageKey);
        }
    }, [state, storageKey]);

    const clearSessionAndReload = () => {
        sessionStorage.removeItem(storageKey);
        window.location.reload();
    };

    const [inputAnswer, setInputAnswer] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [xpEarned, setXpEarned] = useState(0);
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);

    const { submitReview } = useStudyReview(deckId, setXpEarned);

    const { currentIndex, lives, score, correctAnswers, incorrectAnswers, gameStatus } = state.context;
    const currentCard = cards[currentIndex];

    useEffect(() => {
        if (state.value === "question" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [state.value]);

    const handlePass = useCallback(() => {
        setInputAnswer("");
        submitReview({
            cardId: currentCard.id,
            qualityGrade: 0,
            isReviewMode,
        });
        send({ type: "PASS" });
    }, [currentCard.id, isReviewMode, send, submitReview]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!inputAnswer.trim()) {
            handlePass();
            return;
        }

        const fuzzyScore = evaluateAnswer(inputAnswer, currentCard.back);
        const quality = calculateQualityGrade(fuzzyScore);

        send({ type: "SUBMIT_ANSWER", isCorrect: quality >= 4, isPerfect: quality === 5 });

        submitReview({
            cardId: currentCard.id,
            qualityGrade: quality,
            isReviewMode,
        });
    }, [inputAnswer, currentCard.back, currentCard.id, isReviewMode, handlePass, send, submitReview]);

    const handleNext = useCallback(() => {
        setInputAnswer("");
        send({ type: "NEXT_CARD" });
    }, [send]);

    if (cards.length === 0) {
        return (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-white mb-4">No Cards</h2>
                <p className="text-neutral-400">Add cards to this deck before studying.</p>
            </div>
        );
    }

    if (gameStatus === "game_over" || gameStatus === "session_over" || gameStatus === "completed") {
        return (
            <ClassicModeEndScreen
                gameStatus={gameStatus}
                score={score ?? 0}
                correctAnswers={correctAnswers ?? 0}
                incorrectAnswers={incorrectAnswers ?? 0}
                xpEarned={xpEarned}
                onPrimaryClick={clearSessionAndReload}
            />
        );
    }

    const feedbackType = state.value === "feedback_correct"
        ? "correct" as const
        : state.value === "feedback_incorrect"
            ? "incorrect" as const
            : null;

    return (
        <div className="max-w-3xl mx-auto w-full">
            <StudyHUD 
                mode="classic" 
                score={score} 
                lives={lives} 
                onEnd={() => send({ type: "QUIT" })} 
            />

            {/* Progress Bar */}
            <div className="w-full bg-neutral-900 rounded-full h-2 mb-12 overflow-hidden border border-neutral-800">
                <div
                    className="bg-[#f9c111] h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,193,17,0.5)]"
                    style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
                ></div>
            </div>

            <Flashcard
                card={currentCard}
                isFlipped={feedbackType !== null}
                label={`Card ${currentIndex + 1} of ${cards.length}`}
                feedbackType={feedbackType}
                userAnswer={state.value === "feedback_incorrect" ? inputAnswer : undefined}
                onEnlargeChange={setIsImageEnlarged}
            />

            {/* Input Area */}
            <StudyInputArea
                isImageEnlarged={isImageEnlarged}
                stateValue={state.value as string}
                inputRef={inputRef}
                inputAnswer={inputAnswer}
                onInputChange={setInputAnswer}
                onSubmit={handleSubmit}
                onPass={handlePass}
                onNext={handleNext}
                continueButtonText={state.value === "feedback_incorrect" && lives === 0 ? "Finish Game" : "Continue (Press Enter)"}
            />
        </div>
    );
}
