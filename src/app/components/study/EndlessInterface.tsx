"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { evaluateAnswer } from "@/utils/cognitive/fuzzyMatch";
import { calculateQualityGrade } from "@/utils/cognitive/sm2";
import { Card, formatTime, shuffleArray } from "@/utils/study/studyUtils";
import Flashcard from "./Flashcard";
import EndScreenButtons from "./EndScreenButtons";

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
                    const cardMap = new Map(cards.map((c) => [c.id, c]));
                    const restoredQueue = parsed.queueIds
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
        } catch {
            // Ignore
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
        if (!inputAnswer.trim()) return;

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
                isReviewMode: false
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.xpEarned) setXpEarned((prev) => prev + data.xpEarned);
            })
            .catch((err) => console.error("Failed to save review:", err));
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
            <div className="max-w-2xl mx-auto w-full text-center py-24 animate-in zoom-in duration-500">
                <h2 className="text-5xl md:text-6xl font-black text-[#f9c111] mb-4 tracking-tight drop-shadow-lg">Session Over</h2>
                <p className="text-lg text-neutral-400 mb-12">
                    You studied for <span className="text-white font-bold">{formatTime(elapsedSeconds)}</span>
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Score</span>
                        <span className="text-4xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {score.toString().padStart(4, "0")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Right</span>
                        <span className="text-4xl font-black font-mono tracking-widest text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                            {correctAnswers.toString().padStart(2, "0")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Wrong</span>
                        <span className="text-4xl font-black font-mono tracking-widest text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                            {incorrectAnswers.toString().padStart(2, "0")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Cards Seen</span>
                        <span className="text-4xl font-black font-mono tracking-widest text-[#f9c111] drop-shadow-[0_0_15px_rgba(249,193,17,0.4)]">
                            {totalCardsSeen.toString().padStart(2, "0")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">XP Earned</span>
                        <span className="text-4xl font-black font-mono tracking-widest text-[#f9c111] drop-shadow-[0_0_15px_rgba(249,193,17,0.4)]">
                            +{xpEarned}
                        </span>
                    </div>
                </div>

                <EndScreenButtons primaryLabel="Play Again" onPrimaryClick={clearSessionAndReload} />
            </div>
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
            <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-6">
                    <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                        <span className="text-white">{formatTime(elapsedSeconds)}</span>
                    </div>
                    <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                        CARDS <span className="text-[#f9c111]">{totalCardsSeen}</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
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
            />

            {/* Input Area */}
            {feedbackState === "question" ? (
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
                    Continue (Press Enter)
                </button>
            )}
        </div>
    );
}
