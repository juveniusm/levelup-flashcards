"use client";
import { useState } from "react";
import Image from "next/image";
import { Card, getDifficultyLabel } from "@/utils/study/studyUtils";
import { X, SearchCode } from "lucide-react";

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
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

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
                        const { label: diffLabel, color } = getDifficultyLabel(card.ease_factor!, card.interval ?? 0);
                        return (
                            <span className={`absolute top-6 right-6 text-xs font-bold uppercase tracking-widest ${color}`}>
                                {diffLabel}
                            </span>
                        );
                    })()}

                    {card.front_image_url && (
                        <div 
                            onClick={() => setEnlargedImage(card.front_image_url!)}
                            className="group relative min-w-[250px] min-h-[200px] w-full max-h-[336px] flex items-center justify-center mb-6 overflow-hidden rounded-lg shadow-md border border-neutral-700 bg-neutral-950/50 cursor-zoom-in transition-all active:scale-95 hover:border-[#f9c111]/50"
                        >
                            <Image
                                src={card.front_image_url}
                                alt="Front"
                                fill
                                className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <SearchCode className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                        </div>
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
                        <div 
                            onClick={() => setEnlargedImage(card.back_image_url!)}
                            className="group relative min-w-[250px] min-h-[200px] w-full max-h-[336px] flex items-center justify-center mb-6 overflow-hidden rounded-lg shadow-md border border-neutral-700 bg-neutral-950/50 cursor-zoom-in transition-all active:scale-95 hover:border-[#f9c111]/50"
                        >
                            <Image
                                src={card.back_image_url}
                                alt="Back"
                                fill
                                className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <SearchCode className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                        </div>
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

            {/* Enlarged Image Modal */}
            {enlargedImage && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300 cursor-zoom-out"
                    onClick={() => setEnlargedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedImage(null);
                        }}
                    >
                        <X size={32} />
                    </button>
                    
                    <div className="relative w-full h-full max-w-5xl max-h-[85vh] animate-in zoom-in-95 duration-300 flex items-center justify-center">
                        <Image
                            src={enlargedImage}
                            alt="Enlarged"
                            fill
                            className="object-contain select-none"
                            priority
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
