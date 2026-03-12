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
                onClick={() => setShowSelector(true)}
                className={`group relative bg-neutral-900 border transition-all duration-500 rounded-2xl overflow-hidden flex flex-col h-full min-h-[180px] cursor-pointer ${isHighlighted
                    ? "border-[#f9c111]/30 shadow-[0_0_20px_rgba(249,193,17,0.1)] hover:border-[#f9c111]"
                    : "border-neutral-800 hover:border-neutral-700 shadow-lg"
                    }`}
            >
                {/* Main Content Area */}
                <div className="p-6 flex flex-col h-full">
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

                {/* Hover States Visual Cues */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <div className="bg-[#f9c111] p-2 rounded-full text-black shadow-lg">
                        <Play size={16} fill="currentColor" />
                    </div>
                </div>

                {/* Stats Link */}
                <div 
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Link href={`/stats/${deck.id}`} className="p-1.5 text-neutral-500 hover:text-[#f9c111] transition-colors rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm">
                        <BarChart3 size={16} />
                    </Link>
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
