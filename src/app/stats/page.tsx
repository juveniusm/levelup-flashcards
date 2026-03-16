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
        easy: number;
        medium: number;
        hard: number;
        veryHard: number;
        due: number;
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
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${color || "text-white"}`}>
                {value}
            </span>
            {subtext && <span className="text-xs text-neutral-500">{subtext}</span>}
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
                                <th className="text-center px-4 py-3 font-semibold text-emerald-500/80">Mastered</th>
                                <th className="text-center px-4 py-3 font-semibold text-green-500/80">Easy</th>
                                <th className="text-center px-4 py-3 font-semibold text-yellow-500/80">Medium</th>
                                <th className="text-center px-4 py-3 font-semibold text-orange-500/80">Hard</th>
                                <th className="text-center px-4 py-3 font-semibold text-red-500/80">Very Hard</th>
                                <th className="text-center px-4 py-3 font-semibold">Due</th>
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
                                            <span className="text-emerald-400 font-bold">{deck.mastered}</span>
                                            <span className="text-neutral-500 ml-1 text-[11px]">({masteryPct}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-green-400 font-bold font-mono">{deck.easy}</span>
                                            <span className="text-green-500/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.easy/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-yellow-400 font-bold font-mono">{deck.medium}</span>
                                            <span className="text-yellow-500/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.medium/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-orange-400 font-bold font-mono">{deck.hard}</span>
                                            <span className="text-orange-500/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.hard/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-red-400 font-bold font-mono">{deck.veryHard}</span>
                                            <span className="text-red-500/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.veryHard/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className={deck.due > 0 ? "text-[#f9c111] font-bold" : "text-neutral-500"}>{deck.due}</span>
                                        </td>
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
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        fetch(`/api/stats?timezone=${encodeURIComponent(tz)}`)
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
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
            <main className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pt-12 lg:pt-0">
                <header className="border-b border-neutral-800 pb-6">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Your <span className="text-[#f9c111]">Statistics</span>
                    </h1>
                    <p className="text-neutral-400 mt-2 text-lg">Track your progress and mastery.</p>
                </header>

                {/* Overview Cards */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="Decks" value={stats.overview.totalDecks} color="text-[#f9c111]" />
                    <StatCard label="Cards Studied" value={stats.overview.cardsStudied} subtext={`of ${stats.overview.totalCards} total`} color="text-[#f9c111]" />
                    <StatCard label="Total Reviews" value={stats.overview.totalReviews} color="text-[#f9c111]" />
                    <StatCard label="Due Today" value={stats.overview.cardsDueToday} color="text-[#f9c111]" />
                    <StatCard label="Today" value={stats.activity.reviewsToday} subtext={`${stats.activity.reviewsThisWeek} this week`} color="text-[#f9c111]" />
                </section>

                {/* Deck Performance */}
                <section>
                    <DeckPerformanceTable deckBreakdown={stats.deckBreakdown} />
                </section>
            </main>
        </div>
    );
}
