"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Zap, Settings2, BarChart3, ArrowRight, X, Sparkles, Infinity, Target, Brain, Layers, Loader2 } from "lucide-react";
import StudyConfigPanel from "./StudyConfigPanel";

interface StudyDeckCardProps {
    deck: {
        id: string;
        title: string;
        _count: { cards: number };
        dueCount?: number;
        mastery?: number;
        difficultyCounts?: Record<string, number>;
    };
    variant?: "standard" | "highlighted";
}

export default function StudyDeckCard({ deck, variant = "standard" }: StudyDeckCardProps) {
    const [showSelector, setShowSelector] = useState(false);
    const [selectorView, setSelectorView] = useState<"modes" | "custom">("modes");
    const router = useRouter();

    // Live stats — fetched fresh from the server every time Custom mode is opened
    const [liveStats, setLiveStats] = useState<{ totalCards: number; difficultyCounts: Record<string, number> } | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    const fetchFreshStats = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const res = await fetch(`/api/decks/${deck.id}/stats`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setLiveStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch live stats:", err);
        } finally {
            setIsLoadingStats(false);
        }
    }, [deck.id]);

    // Fetch fresh stats whenever Custom config panel is shown
    useEffect(() => {
        if (selectorView === "custom" && showSelector) {
            fetchFreshStats();
        }
    }, [selectorView, showSelector, fetchFreshStats]);

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
            color: "text-foreground"
        },
        {
            id: "focus",
            title: "Focus Mode",
            desc: "Study only Hard and Very Hard cards.",
            icon: Target,
            color: "text-foreground"
        },
        {
            id: "endless",
            title: "Endless Mode",
            desc: "No lives, infinite loops. Practice until you quit.",
            icon: Infinity,
            color: "text-foreground"
        },
        {
            id: "flip",
            title: "Flip Mode",
            desc: "Browse cards without typing. Just flip and go.",
            icon: Layers,
            color: "text-foreground"
        },
        {
            id: "custom",
            title: "Custom Mode",
            desc: "Choose specific difficulties and card limits.",
            icon: Settings2,
            color: "text-gold"
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
                className={`group relative bg-card border transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md ${isHighlighted
                    ? "border-gold/40 bg-gold-soft/40 hover:border-gold/70"
                    : "border-border hover:border-gold/40 shadow-sm"
                    }`}
            >
                {/* Wrap Layout */}
                <div className="flex flex-wrap sm:items-center p-5 gap-4 justify-between">
                    {/* Title and ID */}
                    <div className="flex-1 min-w-[150px] max-w-full">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-semibold text-lg text-foreground transition-colors leading-tight truncate">
                                {deck.title}
                            </h3>
                            {isHighlighted && (
                                <div className="flex-shrink-0 bg-gold text-foreground text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    Due
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        {/* Due Cards */}
                        {deck.dueCount !== undefined && deck.dueCount > 0 && (
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest mb-1">Due</span>
                                <span className="text-foreground font-bold text-base">{deck.dueCount}</span>
                            </div>
                        )}

                        {/* Total Cards */}
                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest mb-1">Total</span>
                            <span className="text-foreground font-bold text-base">{deck._count.cards}</span>
                        </div>

                        {/* Mastery Percentage */}
                        <div className="flex flex-col items-center sm:items-start min-w-[80px]">
                            <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest mb-1 text-center sm:text-left">Mastery</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-black text-lg ${(deck.mastery ?? 0) > 80 ? "text-green-600" : (deck.mastery ?? 0) > 40 ? "text-yellow-600" : "text-muted-foreground"}`}>
                                    {deck.mastery ?? 0}%
                                </span>
                                {/* Small progress bar */}
                                <div className="hidden xs:block w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${(deck.mastery ?? 0) > 80 ? "bg-green-500" : (deck.mastery ?? 0) > 40 ? "bg-gold" : "bg-muted-foreground/40"}`}
                                        style={{ width: `${deck.mastery ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="hidden sm:flex items-center text-muted-foreground/40 group-hover:text-gold transition-colors group-hover:translate-x-1 duration-300">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode Selection Modal */}
            {showSelector && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div
                        className="bg-card border border-border rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/20 blur-[80px] rounded-full pointer-events-none" />

                        {selectorView === "modes" ? (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-display font-bold text-foreground mb-2 tracking-tight">{deck.title}</h2>
                                    <p className="text-muted-foreground font-medium">Choose your study mode</p>
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
                                            className="w-full flex items-center justify-between p-5 bg-secondary border border-border rounded-2xl hover:border-gold/40 hover:bg-accent transition-all group group-active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 bg-muted rounded-xl group-hover:bg-gold-soft transition-colors ${mode.color}`}>
                                                    <mode.icon size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-foreground font-bold mb-0.5">{mode.title}</div>
                                                    <div className="text-muted-foreground text-xs font-medium">{mode.desc}</div>
                                                </div>
                                            </div>
                                            <ArrowRight size={18} className="text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowSelector(false)}
                                    className="w-full text-muted-foreground hover:text-foreground font-bold transition-colors py-2 uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <div>
                                {isLoadingStats ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <Loader2 className="w-6 h-6 text-gold animate-spin" />
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loading stats...</span>
                                    </div>
                                ) : (
                                    <StudyConfigPanel
                                        totalCards={liveStats?.totalCards ?? deck._count.cards}
                                        difficultyCounts={liveStats?.difficultyCounts ?? deck.difficultyCounts}
                                        onCancel={() => setSelectorView("modes")}
                                        onStart={(config) => handleSelect("custom", {
                                            limit: config.limit.toString(),
                                            difficulties: config.difficulties.join(','),
                                            ...(config.noLives ? { noLives: "1" } : {}),
                                        })}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
