import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import StudyInterface from "../../components/study/StudyInterface";
import EndlessInterface from "../../components/study/EndlessInterface";
import FlipInterface from "../../components/study/FlipInterface";
import Link from "next/link";
import { shuffleArray, getCardStats, DIFFICULTY_RANGES } from "@/utils/study/studyUtils";

export const dynamic = "force-dynamic";

export default async function StudyDeckPage({
    params,
    searchParams,
}: {
    params: Promise<{ deckId: string }>;
    searchParams: Promise<{ mode?: string; limit?: string; difficulties?: string }>;
}) {
    const { deckId } = await params;
    const { mode, limit, difficulties } = await searchParams;
    const isReviewMode = mode === "review";
    const isEndlessMode = mode === "endless";
    const isFlipMode = mode === "flip";
    const isFocusMode = mode === "focus";
    const isCustomMode = mode === "custom";

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const deck = await prisma.decks.findUnique({
        where: { id: deckId },
        select: {
            id: true,
            title: true,
            cards: {
                select: {
                    id: true,
                    front: true,
                    back: true,
                    acceptedAnswers: true,
                    front_image_url: true,
                    back_image_url: true,
                    deck_id: true,
                    sm2_stats: userId
                        ? {
                            where: { user_id: userId },
                            select: {
                                ease_factor: true,
                                interval: true,
                                next_review: true,
                            },
                        }
                        : {
                            take: 0,
                        },
                },
            },
        },
    });

    if (!deck) {
        notFound();
    }

    const now = new Date();

    const cardsWithPriority = deck.cards.map((card) => {
        const { easeFactor, interval, isDue } = getCardStats(card.sm2_stats, now);
        const isUnseen = card.sm2_stats.length === 0;

        // Priority logic:
        // Very Hard (1.3) -> Hard (1.8) -> UNSEEN (1.9) -> Medium (2.2) -> Easy (2.5) -> Mastered (2.5+)
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

    // Filter cards based on mode
    let filteredCards = cardsWithPriority;

    if (isReviewMode) {
        filteredCards = cardsWithPriority.filter(c => c._isDue);
    } else if (isFocusMode) {
        // Focus Mode: only Hard (EF <= 1.8) and Very Hard (EF <= 1.5)
        filteredCards = cardsWithPriority.filter(c => c._easeFactor <= 1.8 && c._easeFactor > 0);
    } else if (isCustomMode) {
        const selectedDifficulties = difficulties?.split(',') || [];
        if (selectedDifficulties.length > 0) {
            filteredCards = cardsWithPriority.filter(c => selectedDifficulties.includes(c._difficultyLabel));
        }
    }

    // Apply limit if provided (shuffle first to get random cards if limited)
    if (isCustomMode && limit) {
        const numLimit = parseInt(limit);
        if (!isNaN(numLimit)) {
            filteredCards = shuffleArray(filteredCards).slice(0, numLimit);
        }
    }

    if (filteredCards.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <div className="max-w-md text-center animate-in fade-in zoom-in duration-500">
                    <h2 className="text-4xl font-black text-[#f9c111] mb-4">
                        {isFocusMode ? "No 'Bad' Cards!" : "No cards found!"}
                    </h2>
                    <p className="text-neutral-400 text-lg mb-8">
                        {isFocusMode
                            ? "You don't have any cards in the Hard or Very Hard categories right now. Your mastery is looking strong!"
                            : "We couldn't find any cards matching your criteria. Try adjusting your filters or card limit."}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link
                            href={`/${deckId}/study?mode=study`}
                            className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-xl transition-all shadow-[0_0_20px_rgba(249,193,17,0.3)] hover:shadow-[0_0_30px_rgba(249,193,17,0.5)] hover:-translate-y-1 text-lg"
                        >
                            Study Mode
                        </Link>
                        <Link
                            href="/study"
                            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 px-12 rounded-xl transition-all hover:-translate-y-1 border border-neutral-700 text-lg"
                        >
                            Back to Decks
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Group by difficulty tier, shuffle within each tier, then concatenate in priority order
    const difficultyOrder = ["Very Hard", "Hard", "Unseen", "Medium", "Easy", "Mastered"];

    const getDifficultyTier = (card: typeof filteredCards[number]): string => {
        if (card.sm2_stats.length === 0) return "Unseen";
        if (card._easeFactor >= 2.5 && card._interval >= 21) return "Mastered";
        if (card._easeFactor <= 1.5) return "Very Hard";
        if (card._easeFactor <= 1.8) return "Hard";
        if (card._easeFactor <= 2.2) return "Medium";
        return "Easy";
    };

    const tierGroups: Record<string, typeof filteredCards> = {};
    for (const tier of difficultyOrder) tierGroups[tier] = [];
    for (const card of filteredCards) {
        tierGroups[getDifficultyTier(card)].push(card);
    }

    const sortedCards = difficultyOrder.flatMap(tier => shuffleArray(tierGroups[tier]));

    const finalCards = sortedCards.map(({ _easeFactor, _interval, _isDue, _difficultyLabel, ...card }) => ({
        ...card,
        ease_factor: _easeFactor,
        interval: _interval,
    }));

    // Endless mode: render the EndlessInterface with shuffled cards
    if (isEndlessMode) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <EndlessInterface cards={finalCards} deckId={deck.id} />
            </div>
        );
    }

    // Flip mode: browse cards without typing, no SM2 updates
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
