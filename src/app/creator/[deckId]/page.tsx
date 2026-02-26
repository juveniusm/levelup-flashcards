import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import CreateCardForm from "../../components/cards/CreateCardForm";
import DeleteDeckButton from "../../components/DeleteDeckButton";
import FlashcardList from "../../components/cards/FlashcardList";
import BulkImportCards from "../../components/BulkImportCards";

export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = await params;

    const deck = await prisma.decks.findUnique({
        where: { id: deckId },
        include: {
            cards: {
                orderBy: { card_seq: "asc" }
            }
        }
    });

    if (!deck) {
        notFound();
    }

    const displayDeckId = deck.deck_seq ? String(deck.deck_seq).padStart(3, '0') : '...';

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-neutral-800 pb-6 gap-4">
                    <div>
                        <Link href="/creator" className="text-neutral-500 hover:text-white mb-2 inline-block transition-colors">
                            &larr; Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#f9c111]">{deck.title}</h1>
                        <p className="text-neutral-400 mt-2">{deck.cards.length} Cards in Deck</p>
                        <p className="text-neutral-600 text-xs mt-1 font-mono">Deck #{displayDeckId}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <DeleteDeckButton deckId={deck.id} />
                        {deck.cards.length > 0 && (
                            <Link
                                href={`/${deck.id}/study`}
                                className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-lg transition-colors inline-block"
                            >
                                Study Deck
                            </Link>
                        )}
                    </div>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <CreateCardForm deckId={deck.id} />
                        <BulkImportCards deckId={deck.id} />
                    </div>

                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">Flashcards</h2>

                        {deck.cards.length === 0 ? (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-lg">
                                <p className="text-neutral-400">This deck is empty. Add a flashcard to start learning.</p>
                            </div>
                        ) : (
                            <FlashcardList deckId={deck.id} deckSeq={deck.deck_seq} cards={deck.cards} />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
