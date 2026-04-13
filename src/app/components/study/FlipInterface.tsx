"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, shuffleArray } from "@/utils/study/studyUtils";
import Flashcard from "./Flashcard";

export default function FlipInterface({
    cards,
    deckId,
}: {
    cards: Card[];
    deckId: string;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledCards, setShuffledCards] = useState<Card[]>(() => shuffleArray(cards));

    const currentCard = shuffledCards[currentIndex];
    const isLastCard = currentIndex === shuffledCards.length - 1;

    const handleAction = useCallback(() => {
        if (!isFlipped) {
            setIsFlipped(true);
        } else {
            if (isLastCard) {
                // Reshuffle and restart
                setShuffledCards(shuffleArray(cards));
                setCurrentIndex(0);
            } else {
                setCurrentIndex((prev) => prev + 1);
            }
            setIsFlipped(false);
        }
    }, [isFlipped, isLastCard, cards]);

    // Keyboard: Enter or Space to flip/advance
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleAction();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleAction]);

    if (cards.length === 0) {
        return (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-white mb-4">No Cards</h2>
                <p className="text-neutral-400">Add cards to this deck before studying.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* HUD */}
            <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                    CARD <span className="text-[#f9c111]">{currentIndex + 1}</span> / {shuffledCards.length}
                </div>
                <a
                    href="/study"
                    className="text-sm font-bold text-neutral-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-neutral-700 hover:border-red-400/50 px-4 py-2 rounded-lg"
                >
                    End
                </a>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-900 rounded-full h-2 mb-12 overflow-hidden border border-neutral-800">
                <div
                    className="bg-[#f9c111] h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,193,17,0.5)]"
                    style={{ width: `${((currentIndex + (isFlipped ? 1 : 0)) / shuffledCards.length) * 100}%` }}
                ></div>
            </div>

            <Flashcard
                card={currentCard}
                isFlipped={isFlipped}
                label={`Flip Mode`}
                feedbackType={null}
            />

            {/* Action Button */}
            <div className="flex justify-center mt-4">
                <button
                    onClick={handleAction}
                    className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-xl transition-all shadow-[0_0_20px_rgba(249,193,17,0.3)] hover:shadow-[0_0_30px_rgba(249,193,17,0.5)] hover:-translate-y-1 text-lg"
                >
                    {!isFlipped
                        ? "Reveal Answer"
                        : isLastCard
                            ? "Restart Deck"
                            : "Next Card"
                    }
                </button>
            </div>

            <p className="text-center text-neutral-600 text-xs mt-3 font-medium tracking-wide">
                Press <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Enter</kbd> or <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Space</kbd> to continue
            </p>
        </div>
    );
}
