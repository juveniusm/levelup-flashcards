"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, formatTime, shuffleArray, gradeAnswer } from "@/utils/study/studyUtils";
import { restoreEndlessSession, useEndlessSessionPersist } from "@/hooks/useEndlessSession";
import Flashcard from "./Flashcard";
import SessionMetrics from "./SessionMetrics";
import SessionEndScreen from "./SessionEndScreen";
import StudyInputArea from "./StudyInputArea";
import StudyHUD from "./StudyHUD";
import { useStudyReview } from "@/hooks/useStudyReview";

export default function EndlessInterface({
    cards,
    deckId,
}: {
    cards: Card[];
    deckId: string;
}) {
    const storageKey = `endless-session-${deckId}`;
    const saved = restoreEndlessSession(cards, storageKey);

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

    // Review logic
    const { submitReview } = useStudyReview(deckId, setXpEarned);

    // UI state
    const [feedbackState, setFeedbackState] = useState<"question" | "feedback_correct" | "feedback_incorrect" | "finished">("question");
    const [lastInputAnswer, setLastInputAnswer] = useState("");
    const [matchedAlternative, setMatchedAlternative] = useState<string | undefined>();

    // Persist session
    useEndlessSessionPersist(storageKey, feedbackState, {
        queue, score, correctAnswers, incorrectAnswers, totalCardsSeen, elapsedSeconds,
    });

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

        const { quality, isCorrect, isPerfect, matchedAlternative } = gradeAnswer(inputAnswer, currentCard);
        setMatchedAlternative(matchedAlternative);
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

        submitReview({
            cardId: currentCard.id,
            qualityGrade: quality,
            isReviewMode: false,
        });
    };

    const handlePass = () => {
        setTotalCardsSeen((prev: number) => prev + 1);
        setScore((prev: number) => Math.max(0, prev - 3));
        setIncorrectAnswers((prev: number) => prev + 1);
        setInputAnswer("");
        setMatchedAlternative(undefined);
        setLastInputAnswer("(Passed)");

        submitReview({
            cardId: currentCard.id,
            qualityGrade: 0,
            isReviewMode: false,
        });

        setFeedbackState("feedback_incorrect");
    };

    const handleNext = () => {
        const wasIncorrect = feedbackState === "feedback_incorrect";
        setInputAnswer("");
        setMatchedAlternative(undefined);
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
            <StudyHUD 
                mode="endless" 
                score={score} 
                elapsedSeconds={elapsedSeconds}
                totalCardsSeen={totalCardsSeen}
                onEnd={() => setFeedbackState("finished")} 
            />

            <Flashcard
                card={currentCard}
                isFlipped={feedbackType !== null}
                label="Endless Mode"
                feedbackType={feedbackType}
                feedbackExtra="(-3)"
                userAnswer={lastInputAnswer}
                matchedAlternative={matchedAlternative}
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
