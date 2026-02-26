import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import StudyInterface from "../../components/study/StudyInterface";
import EndlessInterface from "../../components/study/EndlessInterface";
import Link from "next/link";
import { shuffleArray } from "@/utils/study/studyUtils";

export const dynamic = "force-dynamic";

export default async function StudyDeckPage({
    params,
    searchParams,
}: {
    params: Promise<{ deckId: string }>;
    searchParams: Promise<{ mode?: string }>;
}) {
    const { deckId } = await params;
    const { mode } = await searchParams;
    const isReviewMode = mode === "review";
    const isEndlessMode = mode === "endless";

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    const deck = await prisma.decks.findUnique({
        where: { id: deckId },
        include: {
            cards: {
                include: {
                    sm2_stats: userId
                        ? { where: { user_id: userId } }
                        : false,
                },
            },
        },
    });

    if (!deck) {
        notFound();
    }

    const now = new Date();

    const cardsWithPriority = [...deck.cards].map((card) => {
        const stats = (card as { sm2_stats?: unknown[] }).sm2_stats?.[0] as { ease_factor?: number; next_review?: string | Date } | undefined;
        const easeFactor = stats?.ease_factor ?? 2.5;
        const nextReview = stats?.next_review ? new Date(stats.next_review) : null;
        const isDue = nextReview && nextReview <= now; // ONLY due if has stats AND past due

        return {
            ...card,
            _easeFactor: easeFactor,
            _isDue: isDue,
        };
    });

    // In review mode, only show cards that are due for review
    const filteredCards = isReviewMode
        ? cardsWithPriority.filter((c) => c._isDue)
        : cardsWithPriority;

    // If review mode and no cards are due, show a message
    if (isReviewMode && filteredCards.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <div className="max-w-md text-center animate-in fade-in zoom-in duration-500">
                    <h2 className="text-4xl font-black text-[#f9c111] mb-4">All Caught Up! 🎉</h2>
                    <p className="text-neutral-400 text-lg mb-8">
                        No cards are due for review right now. Check back later, or switch to Study Mode to practice the full deck.
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

    // Group by ease_factor bands (rounded to 1 decimal)
    const byEaseBand = new Map<number, typeof filteredCards>();
    for (const card of filteredCards) {
        const key = Math.round(card._easeFactor * 10);
        if (!byEaseBand.has(key)) byEaseBand.set(key, []);
        byEaseBand.get(key)!.push(card);
    }

    // Sort bands ascending (lowest ease = hardest first), shuffle within each band
    const finalCards = [...byEaseBand.entries()]
        .sort(([a], [b]) => a - b)
        .flatMap(([, bandCards]) => shuffleArray(bandCards))
        .map(({ _easeFactor, ...card }) => ({
            ...card,
            ease_factor: _easeFactor,
        }));

    // Endless mode: render the EndlessInterface with shuffled cards
    if (isEndlessMode) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <EndlessInterface cards={finalCards} deckId={deck.id} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
            <StudyInterface cards={finalCards} deckId={deck.id} isReviewMode={isReviewMode} />
        </div>
    );
}
