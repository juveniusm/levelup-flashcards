"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Zap, Settings2, BarChart3, ArrowRight, X, Sparkles, Infinity, Target, Brain } from "lucide-react";
import StudyConfigPanel from "./StudyConfigPanel";

interface StudyDeckCardProps {
    deck: {
        id: string;
        title: string;
        _count: { cards: number };
        dueCount?: number;
        mastery?: number;
    };
    variant?: "standard" | "highlighted";
}

export default function StudyDeckCard({ deck, variant = "standard" }: StudyDeckCardProps) {
    const [showSelector, setShowSelector] = useState(false);
    const [selectorView, setSelectorView] = useState<"modes" | "custom">("modes");
    const router = useRouter();

    const handleSelect = (mode: string, params?: Record<string, string>) => {
        let url = `/${deck.id}/study?mode=${mode}`;
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `&${query}`;
        }
        router.push(url);
    };

    const isHighlighted = variant === "highlighted";

    const studyModes = [
        {
            id: "study",
            title: "Study Mode",
            desc: "All cards, hardest first. Best for exam prep.",
            icon: Brain,
            color: "text-white"
        },
        {
            id: "focus",
            title: "Focus Mode",
            desc: "Study only Hard and Very Hard cards.",
            icon: Target,
            color: "text-white"
        },
        {
            id: "endless",
            title: "Endless Mode",
            desc: "No lives, infinite loops. Practice until you quit.",
            icon: Infinity,
            color: "text-white"
        },
        {
            id: "custom",
            title: "Custom Mode",
            desc: "Choose specific difficulties and card limits.",
            icon: Settings2,
            color: "text-[#f9c111]"
        }
    ];

    return (
        <>
            <div
                onClick={() => {
                    if (isHighlighted) {
                        handleSelect("review");
                    } else {
                        setShowSelector(true);
                    }
                }}
                className={`group relative bg-neutral-900 border transition-all duration-300 rounded-xl overflow-hidden cursor-pointer hover:shadow-2xl ${isHighlighted
                    ? "border-[#f9c111]/30 bg-gradient-to-r from-neutral-900 to-[#f9c111]/5 hover:border-[#f9c111]/60"
                    : "border-neutral-800/80 hover:border-neutral-600 shadow-sm"
                    }`}
            >
                {/* Horizontal Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
                    {/* Title and ID */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-white group-hover:text-[#f9c111] transition-colors leading-tight truncate">
                                {deck.title}
                            </h3>
                            {isHighlighted && (
                                <div className="flex-shrink-0 bg-[#f9c111] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                                    Due
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-medium tracking-wider uppercase opacity-60">
                            DECK ID: {deck.id.slice(0, 8)}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="flex items-center gap-6 sm:gap-8">
                        {/* Total Cards */}
                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-neutral-500 uppercase text-[9px] font-bold tracking-widest mb-1">Total Cards</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-base">{deck._count.cards}</span>
                                {deck.dueCount !== undefined && deck.dueCount > 0 && (
                                    <span className="text-[#f9c111] text-xs font-bold">(+{deck.dueCount})</span>
                                )}
                            </div>
                        </div>

                        {/* Mastery Percentage */}
                        <div className="flex flex-col items-center sm:items-start min-w-[80px]">
                            <span className="text-neutral-500 uppercase text-[9px] font-bold tracking-widest mb-1 text-center sm:text-left">Mastery</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-black text-lg ${(deck.mastery ?? 0) > 80 ? "text-green-400" : (deck.mastery ?? 0) > 40 ? "text-yellow-400" : "text-neutral-400"}`}>
                                    {deck.mastery ?? 0}%
                                </span>
                                {/* Small progress bar */}
                                <div className="hidden xs:block w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${(deck.mastery ?? 0) > 80 ? "bg-green-500" : (deck.mastery ?? 0) > 40 ? "bg-yellow-500" : "bg-neutral-600"}`} 
                                        style={{ width: `${deck.mastery ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="hidden sm:flex items-center text-neutral-700 group-hover:text-[#f9c111] transition-colors group-hover:translate-x-1 duration-300">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode Selection Modal */}
            {showSelector && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                        className="bg-[#111111] border border-neutral-800 rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#f9c111]/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        {selectorView === "modes" ? (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{deck.title}</h2>
                                    <p className="text-neutral-500 font-medium">Choose your study mode</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {studyModes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                if (mode.id === "custom") {
                                                    setSelectorView("custom");
                                                } else {
                                                    handleSelect(mode.id);
                                                }
                                            }}
                                            className="w-full flex items-center justify-between p-5 bg-neutral-900/40 border border-neutral-800/60 rounded-2xl hover:border-neutral-700 hover:bg-neutral-800 transition-all group group-active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 bg-neutral-800 rounded-xl group-hover:bg-neutral-700 transition-colors ${mode.color}`}>
                                                    <mode.icon size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-white font-bold mb-0.5">{mode.title}</div>
                                                    <div className="text-neutral-500 text-xs font-medium">{mode.desc}</div>
                                                </div>
                                            </div>
                                            <ArrowRight size={18} className="text-neutral-600 group-hover:text-[#f9c111] group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowSelector(false)}
                                    className="w-full text-neutral-500 hover:text-white font-bold transition-colors py-2 uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <div>
                                <StudyConfigPanel
                                    totalCards={deck._count.cards}
                                    onCancel={() => setSelectorView("modes")}
                                    onStart={(config) => handleSelect("custom", {
                                        limit: config.limit.toString(),
                                        difficulties: config.difficulties.join(',')
                                    })}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
