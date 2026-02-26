"use client";

import { useEffect, useState } from "react";


interface StatsData {
    overview: {
        totalDecks: number;
        totalCards: number;
        totalReviews: number;
        cardsStudied: number;
        cardsDueToday: number;
    };
    mastery: {
        avgEaseFactor: number;
        masteredCards: number;
        learningCards: number;
        newCards: number;
    };
    activity: {
        reviewsToday: number;
        reviewsThisWeek: number;
        reviewsThisMonth: number;
        dailyReviews: { date: string; count: number }[];
    };
    deckBreakdown: {
        deckId: string;
        title: string;
        totalCards: number;
        mastered: number;
        due: number;
        avgEase: number;
    }[];
    modeBreakdown: {
        review: number;
        study: number;
        endless: number;
    };
}

function StatCard({ label, value, subtext, color }: {
    label: string;
    value: string | number;
    subtext?: string;
    color?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
            <span className={`text-3xl font-black font-mono tracking-wider ${color || "text-white"}`}>
                {value}
            </span>
            {subtext && <span className="text-xs text-neutral-500">{subtext}</span>}
        </div>
    );
}



function MasteryBreakdown({ mastery }: { mastery: StatsData["mastery"] }) {
    const total = mastery.masteredCards + mastery.learningCards + mastery.newCards;
    const masteredPct = total > 0 ? (mastery.masteredCards / total) * 100 : 0;
    const learningPct = total > 0 ? (mastery.learningCards / total) * 100 : 0;
    const newPct = total > 0 ? (mastery.newCards / total) * 100 : 0;

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                Card Mastery
            </h3>

            {/* Progress Bar */}
            <div className="h-4 rounded-full bg-neutral-800 overflow-hidden flex mb-4">
                {masteredPct > 0 && (
                    <div className="bg-green-500 transition-all duration-500" style={{ width: `${masteredPct}%` }} />
                )}
                {learningPct > 0 && (
                    <div className="bg-[#f9c111] transition-all duration-500" style={{ width: `${learningPct}%` }} />
                )}
                {newPct > 0 && (
                    <div className="bg-neutral-600 transition-all duration-500" style={{ width: `${newPct}%` }} />
                )}
            </div>

            <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-neutral-400">Mastered</span>
                    <span className="font-bold text-white">{mastery.masteredCards}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f9c111]" />
                    <span className="text-neutral-400">Learning</span>
                    <span className="font-bold text-white">{mastery.learningCards}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                    <span className="text-neutral-400">New</span>
                    <span className="font-bold text-white">{mastery.newCards}</span>
                </div>
            </div>
        </div>
    );
}

function ModeBreakdown({ modeBreakdown }: { modeBreakdown: StatsData["modeBreakdown"] }) {
    const total = modeBreakdown.review + modeBreakdown.study + modeBreakdown.endless;

    const modes = [
        { label: "Review", count: modeBreakdown.review, color: "bg-[#f9c111]" },
        { label: "Study", count: modeBreakdown.study, color: "bg-blue-500" },
        { label: "Endless", count: modeBreakdown.endless, color: "bg-purple-500" },
    ];

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                Study Mode Split
            </h3>
            {total === 0 ? (
                <p className="text-neutral-500 text-sm">No reviews recorded yet.</p>
            ) : (
                <div className="space-y-3">
                    {modes.map((mode) => {
                        const pct = total > 0 ? (mode.count / total) * 100 : 0;
                        return (
                            <div key={mode.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-neutral-400">{mode.label}</span>
                                    <span className="text-white font-bold">{mode.count} <span className="text-neutral-500 font-normal">({Math.round(pct)}%)</span></span>
                                </div>
                                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                                    <div className={`${mode.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function DeckPerformanceTable({ deckBreakdown }: { deckBreakdown: StatsData["deckBreakdown"] }) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                    Deck Performance
                </h3>
            </div>
            {deckBreakdown.length === 0 ? (
                <p className="px-6 pb-6 text-neutral-500 text-sm">No decks found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-t border-neutral-800 text-neutral-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-6 py-3 font-semibold">Deck</th>
                                <th className="text-center px-4 py-3 font-semibold">Cards</th>
                                <th className="text-center px-4 py-3 font-semibold">Mastered</th>
                                <th className="text-center px-4 py-3 font-semibold">Due</th>
                                <th className="text-center px-4 py-3 font-semibold">Avg Ease</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deckBreakdown.map((deck) => {
                                const masteryPct = deck.totalCards > 0 ? Math.round((deck.mastered / deck.totalCards) * 100) : 0;
                                return (
                                    <tr key={deck.deckId} className="border-t border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{deck.title}</td>
                                        <td className="text-center px-4 py-4 text-white">{deck.totalCards}</td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-green-400 font-bold">{deck.mastered}</span>
                                            <span className="text-neutral-600 ml-1 text-xs">({masteryPct}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className={deck.due > 0 ? "text-[#f9c111] font-bold" : "text-neutral-500"}>{deck.due}</span>
                                        </td>
                                        <td className="text-center px-4 py-4 text-white font-mono">{deck.avgEase || "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then((res) => res.json())
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse text-neutral-500 text-lg">Loading statistics...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-red-400 text-lg">Failed to load statistics.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                <header className="border-b border-neutral-800 pb-6">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Your <span className="text-[#f9c111]">Statistics</span>
                    </h1>
                    <p className="text-neutral-400 mt-2 text-lg">Track your progress and mastery.</p>
                </header>

                {/* Overview Cards */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="Decks" value={stats.overview.totalDecks} color="text-[#f9c111]" />
                    <StatCard label="Cards Studied" value={stats.overview.cardsStudied} subtext={`of ${stats.overview.totalCards} total`} color="text-blue-400" />
                    <StatCard label="Total Reviews" value={stats.overview.totalReviews} color="text-purple-400" />
                    <StatCard label="Due Today" value={stats.overview.cardsDueToday} color="text-[#f9c111]" />
                    <StatCard label="Today" value={stats.activity.reviewsToday} subtext={`${stats.activity.reviewsThisWeek} this week`} color="text-green-400" />
                </section>

                {/* Deck Performance */}
                <section>
                    <DeckPerformanceTable deckBreakdown={stats.deckBreakdown} />
                </section>
            </main>
        </div>
    );
}
