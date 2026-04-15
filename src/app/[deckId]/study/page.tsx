"use client";

import { useState, useEffect, use } from "react";
import StudyInterface from "../../components/study/StudyInterface";
import EndlessInterface from "../../components/study/EndlessInterface";
import FlipInterface from "../../components/study/FlipInterface";
import Link from "next/link";
import { shuffleArray, getCardStats } from "@/utils/study/studyUtils";
import { db } from "@/lib/indexedDB";

export default function StudyDeckPage({
    params,
    searchParams,
}: {
    params: Promise<{ deckId: string }>;
    searchParams: Promise<{ mode?: string; limit?: string; difficulties?: string }>;
}) {
    const { deckId } = use(params);
    const resolvedSearchParams = use(searchParams);
    const mode = resolvedSearchParams.mode;
    const limit = resolvedSearchParams.limit;
    const difficulties = resolvedSearchParams.difficulties;

    const isReviewMode = mode === "review";
    const isEndlessMode = mode === "endless";
    const isFlipMode = mode === "flip";
    const isFocusMode = mode === "focus";
    const isCustomMode = mode === "custom";

    const [deck, setDeck] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchDeck = async () => {
            try {
                if (navigator.onLine) {
                    const res = await fetch(`/api/decks/${deckId}/studyData`);
                    if (res.ok) {
                        const data = await res.json();
                        if (isMounted) setDeck(data.deck);
                        return;
                    }
                }
                
                // Fallback to IndexedDB
                const localDeck = await db.offlineDecks.get(deckId);
                if (localDeck) {
                    if (isMounted) setDeck(localDeck);
                } else {
                    if (isMounted) setError("Deck not found locally. Please reconnect to download it.");
                }
            } catch (err) {
                console.error("Hydration Error:", err);
                const localDeck = await db.offlineDecks.get(deckId);
                if (localDeck && isMounted) {
                    setDeck(localDeck);
                } else if (isMounted) {
                    setError("Failed to load deck.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchDeck();
        return () => { isMounted = false; };
    }, [deckId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-64 h-8 bg-neutral-800 rounded-lg mb-8"></div>
                    <div className="w-full max-w-sm h-72 bg-neutral-800 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    if (error || !deck) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 text-center">
                <h2 className="text-3xl font-bold text-red-500 mb-4">Are you offline?</h2>
                <p className="text-neutral-400 mb-8">{error || "Deck not found."}</p>
                <Link href="/study" className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-8 rounded-xl">
                    Go Back
                </Link>
            </div>
        );
    }

    const now = new Date();

    const cardsWithPriority = deck.cards.map((card: any) => {
        const sm2_stats = card.sm2_stats || [];
        const { easeFactor, interval, isDue } = getCardStats(sm2_stats, now);
        const isUnseen = sm2_stats.length === 0;

        const sortingEf = isUnseen ? 1.9 : (isDue ? easeFactor - 0.1 : easeFactor);

        return {
            ...card,
            _easeFactor: easeFactor,
            _sortingEf: sortingEf,
            _interval: interval,
            _isDue: isDue,
            _difficultyLabel: isDue ? "Due" : (() => {
                if (isUnseen) return "Unseen";
                if (easeFactor >= 2.5 && interval >= 21) return "Mastered";
                if (easeFactor <= 1.5) return "Very Hard";
                if (easeFactor <= 1.8) return "Hard";
                if (easeFactor <= 2.2) return "Medium";
                return "Easy";
            })()
        };
    });

    let filteredCards = cardsWithPriority;

    if (isReviewMode) filteredCards = cardsWithPriority.filter((c: any) => c._isDue);
    else if (isFocusMode) filteredCards = cardsWithPriority.filter((c: any) => c._easeFactor <= 1.8 && c._easeFactor > 0);
    else if (isCustomMode) {
        const selectedDifficulties = difficulties?.split(',') || [];
        if (selectedDifficulties.length > 0) {
            filteredCards = cardsWithPriority.filter((c: any) => selectedDifficulties.includes(c._difficultyLabel));
        }
    }

    if (isCustomMode && limit) {
        const numLimit = parseInt(limit);
        if (!isNaN(numLimit)) filteredCards = shuffleArray(filteredCards).slice(0, numLimit);
    }

    if (filteredCards.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 text-center">
                <h2 className="text-4xl font-black text-[#f9c111] mb-4">No cards found!</h2>
                <Link href={`/${deckId}/study?mode=study`} className="bg-[#f9c111] text-black font-bold py-4 px-12 rounded-xl mb-4">
                    Study Mode
                </Link>
                <Link href="/study" className="bg-neutral-800 text-white font-bold py-4 px-12 rounded-xl">
                    Back to Decks
                </Link>
            </div>
        );
    }

    const difficultyOrder = ["Very Hard", "Hard", "Unseen", "Medium", "Easy", "Mastered"];
    const tierGroups: Record<string, typeof filteredCards> = {};
    for (const tier of difficultyOrder) tierGroups[tier] = [];
    for (const card of filteredCards) {
        const tier = card._difficultyLabel !== "Due" ? card._difficultyLabel : (() => {
            if (card._easeFactor <= 1.5) return "Very Hard";
            if (card._easeFactor <= 1.8) return "Hard";
            if (card._easeFactor <= 2.2) return "Medium";
            return "Easy";
        })();
        tierGroups[tier].push(card);
    }

    const sortedCards = difficultyOrder.flatMap(tier => shuffleArray(tierGroups[tier]));
    const finalCards = sortedCards.map((card: any) => {
        const { _easeFactor, _interval, _isDue, _difficultyLabel, ...rest } = card;
        return {
            ...rest,
            ease_factor: _easeFactor,
            interval: _interval,
        };
    });

    if (isEndlessMode) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <EndlessInterface cards={finalCards} deckId={deck.id} />
            </div>
        );
    }

    if (isFlipMode) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <FlipInterface cards={finalCards} deckId={deck.id} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
            <StudyInterface cards={finalCards} deckId={deck.id} mode={mode} isReviewMode={isReviewMode} />
        </div>
    );
}
