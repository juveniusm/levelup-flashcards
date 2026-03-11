import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Zap, Settings2, BarChart3 } from "lucide-react";
import StudyConfigPanel from "./StudyConfigPanel";

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
    const [showConfig, setShowConfig] = useState(false);
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

    return (
        <div
            className={`group relative bg-neutral-900 border transition-all duration-500 rounded-2xl overflow-hidden flex flex-col h-full min-h-[180px] ${isHighlighted
                ? "border-[#f9c111]/30 shadow-[0_0_20px_rgba(249,193,17,0.1)] hover:border-[#f9c111]"
                : "border-neutral-800 hover:border-neutral-700 shadow-lg"
                }`}
        >
            {/* Main Content Area */}
            <div className={`p-6 flex flex-col h-full transition-all duration-500 ${showConfig ? "opacity-0 -translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-white group-hover:text-[#f9c111] transition-colors leading-tight line-clamp-2 pr-6">
                        {deck.title}
                    </h3>
                    {isHighlighted && (
                        <div className="bg-[#f9c111] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                            Due
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 flex justify-between items-center text-sm">
                    <div className="bg-black/40 backdrop-blur-sm border border-neutral-800/50 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest flex items-center gap-4 whitespace-nowrap shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500 uppercase text-[9px]">Total</span>
                            <span className="text-white">{deck._count.cards}</span>
                        </div>
                        {deck.dueCount !== undefined && deck.dueCount > 0 && (
                            <>
                                <div className="w-px h-3 bg-neutral-800" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[#f9c111]/70 uppercase text-[9px]">Due Today</span>
                                    <span className="text-[#f9c111] drop-shadow-[0_0_8px_rgba(249,193,17,0.3)]">
                                        {deck.dueCount}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Hover Overlay */}
            {!showConfig && (
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-[2px] border-t border-white/5">
                    <div className="flex gap-2">
                        {deck.dueCount !== undefined && deck.dueCount > 0 && (
                            <button
                                onClick={() => handleSelect("review")}
                                className="flex-1 bg-[#f9c111] hover:bg-yellow-400 text-black font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(249,193,17,0.2)]"
                            >
                                <Zap size={14} className="fill-current" />
                                Flash Review
                            </button>
                        )}
                        <button
                            onClick={() => handleSelect("study")}
                            className="flex-1 bg-white hover:bg-neutral-200 text-black font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Play size={14} className="fill-current" />
                            Full Study
                        </button>
                        <button
                            onClick={() => setShowConfig(true)}
                            className="w-10 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 border border-neutral-700"
                            title="Custom Setup"
                        >
                            <Settings2 size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Config Panel Drawer */}
            <div className={`absolute inset-0 bg-neutral-900/95 backdrop-blur-md p-6 transition-all duration-500 transform ${showConfig ? "translate-x-0" : "translate-x-full"}`}>
                {showConfig && (
                    <StudyConfigPanel
                        totalCards={deck._count.cards}
                        onCancel={() => setShowConfig(false)}
                        onStart={(config) => handleSelect("custom", {
                            limit: config.limit.toString(),
                            difficulties: config.difficulties.join(',')
                        })}
                    />
                )}
            </div>

            {/* Stats Link (Optional but fits UX) */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/stats/${deck.id}`} className="p-1.5 text-neutral-500 hover:text-[#f9c111] transition-colors rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm">
                    <BarChart3 size={16} />
                </Link>
            </div>
        </div>
    );
}
