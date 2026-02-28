"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StudyDeckCardProps {
    deck: {
        id: string;
        title: string;
        _count: { cards: number };
        dueCount?: number;
    };
    variant?: "standard" | "highlighted";
}

export default function StudyDeckCard({ deck, variant = "standard" }: StudyDeckCardProps) {
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    const handleSelect = (mode: "review" | "study" | "endless") => {
        setShowModal(false);
        router.push(`/${deck.id}/study?mode=${mode}`);
    };

    const handleCardClick = () => {
        if (variant === "highlighted") {
            // Teleport directly to review mode
            router.push(`/${deck.id}/study?mode=review`);
        } else {
            setShowModal(true);
        }
    };

    const isHighlighted = variant === "highlighted";

    return (
        <>
            <div
                onClick={handleCardClick}
                className={`bg-neutral-900 border transition-all duration-300 rounded-xl p-6 cursor-pointer group flex flex-col h-full ${isHighlighted
                    ? "hover:border-[#f9c111] animate-pulse-subtle"
                    : "border-neutral-800 hover:border-neutral-700 shadow-lg hover:shadow-[#f9c111]/10"
                    }`}
            >
                <h3 className="font-semibold text-lg text-white group-hover:text-[#f9c111] transition-colors leading-tight">
                    {deck.title}
                </h3>
                <div className="mt-auto pt-6 flex justify-between items-center text-sm">
                    <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest flex items-center gap-3 whitespace-nowrap shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500 uppercase">Total</span>
                            <span className="text-white">{deck._count.cards}</span>
                        </div>
                        <div className="w-px h-3 bg-neutral-800" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500 uppercase">Due</span>
                            <span className={deck.dueCount && deck.dueCount > 0 ? "text-[#f9c111]" : "text-neutral-500"}>
                                {deck.dueCount || 0}
                            </span>
                        </div>
                    </div>
                    {isHighlighted ? (
                        <span className="flex items-center gap-1 font-bold text-[#f9c111] group-hover:translate-x-1 transition-transform">
                            Review Now <span>&rarr;</span>
                        </span>
                    ) : (
                        <span className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 font-medium text-[#f9c111]">
                            Study Options <span>&rarr;</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Mode Selection Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-white mb-2">
                            {deck.title}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-8">
                            Choose your study mode
                        </p>

                        <div className="space-y-3">
                            {/* Study Mode */}
                            <button
                                onClick={() => handleSelect("study")}
                                className="w-full text-left bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-[#f9c111]/50 rounded-xl p-5 transition-all group/btn"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white group-hover/btn:text-[#f9c111] transition-colors text-lg flex items-center gap-2">
                                            Study Mode
                                        </h4>
                                        <p className="text-neutral-400 text-sm mt-1">
                                            All cards, hardest first. Best for exam prep.
                                        </p>
                                    </div>
                                    <span className="text-neutral-600 group-hover/btn:text-[#f9c111] transition-colors text-xl">&rarr;</span>
                                </div>
                            </button>

                            {/* Review Mode */}
                            <button
                                onClick={() => handleSelect("review")}
                                className="w-full text-left bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-[#f9c111]/50 rounded-xl p-5 transition-all group/btn"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white group-hover/btn:text-[#f9c111] transition-colors text-lg flex items-center gap-2">
                                            Review Mode
                                        </h4>
                                        <p className="text-neutral-400 text-sm mt-1">
                                            Only cards due for review. Best for daily retention.
                                        </p>
                                    </div>
                                    <span className="text-neutral-600 group-hover/btn:text-[#f9c111] transition-colors text-xl">&rarr;</span>
                                </div>
                            </button>

                            {/* Endless Mode */}
                            <button
                                onClick={() => handleSelect("endless")}
                                className="w-full text-left bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-[#f9c111]/50 rounded-xl p-5 transition-all group/btn"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white group-hover/btn:text-[#f9c111] transition-colors text-lg flex items-center gap-2">
                                            Endless Mode
                                        </h4>
                                        <p className="text-neutral-400 text-sm mt-1">
                                            No lives, infinite loops. Practice until you quit.
                                        </p>
                                    </div>
                                    <span className="text-neutral-600 group-hover/btn:text-[#f9c111] transition-colors text-xl">&rarr;</span>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full mt-4 text-center text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
