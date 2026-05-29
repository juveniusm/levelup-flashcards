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
                <h2 className="text-2xl font-bold text-foreground mb-4">No Cards</h2>
                <p className="text-muted-foreground">Add cards to this deck before studying.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* HUD */}
            <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                <div className="text-lg font-bold font-mono tracking-widest text-muted-foreground">
                    CARD <span className="text-foreground">{currentIndex + 1}</span> / {shuffledCards.length}
                </div>
                <a
                    href="/study"
                    className="text-sm font-bold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest border border-border hover:border-destructive/50 px-4 py-2 rounded-lg"
                >
                    End
                </a>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-12 overflow-hidden border border-border">
                <div
                    className="bg-gold h-2 rounded-full transition-all duration-500 ease-out"
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
                    className="bg-gold hover:bg-gold/90 text-foreground font-bold py-4 px-12 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-1 text-lg"
                >
                    {!isFlipped
                        ? "Reveal Answer"
                        : isLastCard
                            ? "Restart Deck"
                            : "Next Card"
                    }
                </button>
            </div>

            <p className="text-center text-muted-foreground text-xs mt-3 font-medium tracking-wide">
                Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Enter</kbd> or <kbd className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Space</kbd> to continue
            </p>
        </div>
    );
}
