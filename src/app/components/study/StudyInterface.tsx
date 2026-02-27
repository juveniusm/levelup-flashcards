"use client";

import { useMachine } from "@xstate/react";
import { classicModeMachine } from "@/machines/classicModeMachine";
import { useState, useRef, useEffect } from "react";
import { evaluateAnswer } from "@/utils/cognitive/fuzzyMatch";
import { calculateQualityGrade } from "@/utils/cognitive/sm2";
import { Card } from "@/utils/study/studyUtils";
import Flashcard from "./Flashcard";
import SessionMetrics from "./SessionMetrics";
import SessionEndScreen from "./SessionEndScreen";

export default function StudyInterface({
    cards,
    deckId,
    isReviewMode = false,
}: {
    cards: Card[];
    deckId: string;
    isReviewMode?: boolean;
}) {
    const storageKey = `study-session-${deckId}`;

    const getSavedState = () => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.context && parsed.context.cards?.length === cards.length) {
                    return classicModeMachine.resolveState({
                        value: parsed.stateValue,
                        context: {
                            ...parsed.context,
                            cards,
                        },
                    });
                }
            }
        } catch {
            // Ignore parse errors
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
                    cards: context.cards.map((c: Card) => ({ id: c.id })),
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

    const { currentIndex, lives, score, correctAnswers, incorrectAnswers, gameStatus } = state.context;
    const currentCard = cards[currentIndex];

    useEffect(() => {
        if (state.value === "question" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [state.value]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputAnswer.trim()) return;

        const fuzzyScore = evaluateAnswer(inputAnswer, currentCard.back);
        const quality = calculateQualityGrade(fuzzyScore);

        send({ type: "SUBMIT_ANSWER", isCorrect: quality >= 4, isPerfect: quality === 5 });

        fetch(`/api/decks/${deckId}/cards/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cardId: currentCard.id,
                qualityGrade: quality,
                isReviewMode,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.xpEarned) setXpEarned((prev) => prev + data.xpEarned);
            })
            .catch((err) => console.error("Failed to save review:", err));
    };

    const handleNext = () => {
        setInputAnswer("");
        send({ type: "NEXT_CARD" });
    };

    if (cards.length === 0) {
        return (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-white mb-4">No Cards</h2>
                <p className="text-neutral-400">Add cards to this deck before studying.</p>
            </div>
        );
    }

    if (gameStatus === "game_over") {
        return (
            <SessionEndScreen
                title="Game Over"
                titleColorClass="text-red-500"
                subtitle="You ran out of lives!"
                primaryButtonLabel="Try Again"
                onPrimaryClick={clearSessionAndReload}
            >
                <SessionMetrics
                    score={score ?? 0}
                    correctAnswers={correctAnswers ?? 0}
                    incorrectAnswers={incorrectAnswers ?? 0}
                    xpEarned={xpEarned}
                />
            </SessionEndScreen>
        );
    }

    if (gameStatus === "session_over") {
        return (
            <SessionEndScreen
                title="Session Over"
                titleColorClass="text-[#f9c111]"
                subtitle="You ended the session early."
                primaryButtonLabel="Try Again"
                onPrimaryClick={clearSessionAndReload}
            >
                <SessionMetrics
                    score={score ?? 0}
                    correctAnswers={correctAnswers ?? 0}
                    incorrectAnswers={incorrectAnswers ?? 0}
                    xpEarned={xpEarned}
                />
            </SessionEndScreen>
        );
    }

    if (gameStatus === "completed") {
        return (
            <SessionEndScreen
                title="Deck Complete!"
                titleColorClass="text-[#f9c111]"
                primaryButtonLabel="Study Again"
                onPrimaryClick={clearSessionAndReload}
            >
                <SessionMetrics
                    score={score ?? 0}
                    correctAnswers={correctAnswers ?? 0}
                    incorrectAnswers={incorrectAnswers ?? 0}
                    xpEarned={xpEarned}
                />
            </SessionEndScreen>
        );
    }

    const feedbackType = state.value === "feedback_correct"
        ? "correct" as const
        : state.value === "feedback_incorrect"
            ? "incorrect" as const
            : null;

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* HUD */}
            <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                <div className="flex gap-2 text-2xl">
                    {Array.from({ length: Math.max(5, lives) }).map((_, i) => (
                        <span key={i} className={i < lives ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-neutral-800"}>
                            &hearts;
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-xl font-bold font-mono tracking-widest text-white">
                        SCORE <span className="text-[#f9c111]">{score.toString().padStart(4, "0")}</span>
                    </div>
                    <button
                        onClick={() => send({ type: "QUIT" })}
                        className="text-sm font-bold text-neutral-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-neutral-700 hover:border-red-400/50 px-4 py-2 rounded-lg"
                    >
                        End
                    </button>
                </div>
            </div>

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
                userAnswer={inputAnswer}
            />

            {/* Input Area */}
            {state.value === "question" ? (
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputAnswer}
                        onChange={(e) => setInputAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        autoComplete="off"
                        className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-6 py-4 text-xl text-white focus:outline-none focus:border-[#f9c111] transition-colors shadow-inner"
                    />
                    <button
                        type="submit"
                        className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold px-8 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(249,193,17,0.39)] hover:shadow-[0_6px_20px_rgba(249,193,17,0.23)] hover:-translate-y-0.5"
                    >
                        Submit
                    </button>
                </form>
            ) : (
                <button
                    onClick={handleNext}
                    autoFocus
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 rounded-xl transition-colors border-2 border-neutral-700 focus:border-[#f9c111] focus:outline-none"
                >
                    {state.value === "feedback_incorrect" && lives === 0
                        ? "Finish Game"
                        : "Continue (Press Enter)"}
                </button>
            )}
        </div>
    );
}
