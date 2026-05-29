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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${color || "text-foreground"}`}>
                {value}
            </span>
            {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
        </div>
    );
}


function DeckPerformanceTable({ deckBreakdown }: { deckBreakdown: StatsData["deckBreakdown"] }) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Deck Performance
                </h3>
            </div>
            {deckBreakdown.length === 0 ? (
                <p className="px-6 pb-6 text-muted-foreground text-sm">No decks found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-t border-border text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="text-left px-6 py-3 font-semibold">Deck</th>
                                <th className="text-center px-4 py-3 font-semibold">Cards</th>
                                <th className="text-center px-4 py-3 font-semibold text-emerald-700">Mastered</th>
                                <th className="text-center px-4 py-3 font-semibold text-green-700">Easy</th>
                                <th className="text-center px-4 py-3 font-semibold text-yellow-700">Medium</th>
                                <th className="text-center px-4 py-3 font-semibold text-orange-700">Hard</th>
                                <th className="text-center px-4 py-3 font-semibold text-red-700">Very Hard</th>
                                <th className="text-center px-4 py-3 font-semibold">Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deckBreakdown.map((deck) => {
                                const masteryPct = deck.totalCards > 0 ? Math.round((deck.mastered / deck.totalCards) * 100) : 0;
                                return (
                                    <tr key={deck.deckId} className="border-t border-border hover:bg-muted transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{deck.title}</td>
                                        <td className="text-center px-4 py-4 text-foreground">{deck.totalCards}</td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-emerald-600 font-bold">{deck.mastered}</span>
                                            <span className="text-muted-foreground ml-1 text-[11px]">({masteryPct}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-green-600 font-bold font-mono">{deck.easy}</span>
                                            <span className="text-green-600/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.easy/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-yellow-600 font-bold font-mono">{deck.medium}</span>
                                            <span className="text-yellow-600/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.medium/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-orange-600 font-bold font-mono">{deck.hard}</span>
                                            <span className="text-orange-600/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.hard/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className="text-red-600 font-bold font-mono">{deck.veryHard}</span>
                                            <span className="text-red-600/80 ml-1 text-[11px]">({deck.totalCards > 0 ? Math.round((deck.veryHard/deck.totalCards)*100) : 0}%)</span>
                                        </td>
                                        <td className="text-center px-4 py-4">
                                            <span className={deck.due > 0 ? "text-foreground font-bold" : "text-muted-foreground"}>{deck.due}</span>
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
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-lg">Loading statistics...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-destructive text-lg">Failed to load statistics.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
            <main className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pt-12 lg:pt-0">
                <header className="border-b border-border pb-6">
                    <h1 className="text-4xl font-display font-bold tracking-tight">
                        Your <span className="italic">Statistics</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Track your progress and mastery.</p>
                </header>

                {/* Overview Cards */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="Decks" value={stats.overview.totalDecks} color="text-foreground" />
                    <StatCard label="Cards Studied" value={stats.overview.cardsStudied} subtext={`of ${stats.overview.totalCards} total`} color="text-foreground" />
                    <StatCard label="Total Reviews" value={stats.overview.totalReviews} color="text-foreground" />
                    <StatCard label="Due Today" value={stats.overview.cardsDueToday} color="text-foreground" />
                    <StatCard label="Today" value={stats.activity.reviewsToday} subtext={`${stats.activity.reviewsThisWeek} this week`} color="text-foreground" />
                </section>

                {/* Deck Performance */}
                <section>
                    <DeckPerformanceTable deckBreakdown={stats.deckBreakdown} />
                </section>
            </main>
        </div>
    );
}
