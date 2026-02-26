"use client";

import { Card, getDifficultyLabel } from "@/utils/study/studyUtils";

interface FlashcardProps {
    card: Card;
    isFlipped: boolean;
    label: string; // e.g. "Card 1 of 10" or "Endless Mode"
    feedbackType: "correct" | "incorrect" | null;
    feedbackExtra?: string; // e.g. penalty text like "(-3)"
    userAnswer?: string;
}

export default function Flashcard({
    card,
    isFlipped,
    label,
    feedbackType,
    feedbackExtra,
    userAnswer,
}: FlashcardProps) {
    return (
        <div className="perspective-1000 mb-12">
            <div
                className={`relative w-full h-[28rem] transition-transform preserve-3d shadow-2xl ${!isFlipped ? "duration-0" : "duration-700 rotate-x-180"
                    }`}
            >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center z-10 overflow-y-auto">
                    <span className="absolute top-6 left-6 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                        {label}
                    </span>

                    {card.ease_factor !== undefined && (() => {
                        const { label: diffLabel, color } = getDifficultyLabel(card.ease_factor!);
                        return (
                            <span className={`absolute top-6 right-6 text-xs font-bold uppercase tracking-widest ${color}`}>
                                {diffLabel}
                            </span>
                        );
                    })()}

                    {card.front_image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={card.front_image_url}
                            alt="Front Image"
                            className="min-w-[250px] min-h-[200px] max-h-[336px] max-w-[90%] object-contain mb-6 rounded-lg shadow-md border border-neutral-700 bg-neutral-950/50"
                        />
                    )}

                    <h2 className="text-3xl font-semibold text-white leading-tight">
                        {card.front}
                    </h2>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-x-180 bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center overflow-y-auto">
                    <span className="absolute top-6 left-6 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                        Target Answer
                    </span>

                    {card.back_image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={card.back_image_url}
                            alt="Back Image"
                            className="min-w-[250px] min-h-[200px] max-h-[336px] max-w-[90%] object-contain mb-6 rounded-lg shadow-md border border-neutral-700 bg-neutral-950/50"
                        />
                    )}

                    <h2 className="text-3xl font-semibold text-[#f9c111] leading-tight mb-8">
                        {card.back}
                    </h2>

                    {feedbackType === "correct" && (
                        <div className="text-green-500 text-xl font-bold bg-green-500/10 px-8 py-3 rounded-full border border-green-500/20 animate-in slide-in-from-bottom-4 duration-300">
                            Correct!
                        </div>
                    )}
                    {feedbackType === "incorrect" && (
                        <div className="text-red-500 text-xl font-bold bg-red-500/10 px-8 py-3 rounded-full border border-red-500/20 animate-in slide-in-from-bottom-4 duration-300 flex flex-col items-center">
                            <span>Incorrect{feedbackExtra ? ` ${feedbackExtra}` : ""}</span>
                            {userAnswer && (
                                <span className="text-sm font-normal text-neutral-400 mt-1">
                                    You wrote: &quot;{userAnswer}&quot;
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
