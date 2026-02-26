import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditCardForm from "../../../../../components/cards/EditCardForm";

export const dynamic = "force-dynamic";

export default async function EditCardPage({ params }: { params: Promise<{ deckId: string; cardId: string }> }) {
    const { deckId, cardId } = await params;

    const deck = await prisma.decks.findUnique({
        where: { id: deckId }
    });

    const card = await prisma.cards.findUnique({
        where: { id: cardId }
    });

    if (!deck || !card || card.deck_id !== deckId) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
                <header className="border-b border-neutral-800 pb-6">
                    <Link href={`/creator/${deckId}`} className="text-neutral-500 hover:text-white mb-4 inline-block transition-colors">
                        &larr; Back to {deck.title}
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#f9c111]">Edit Flashcard</h1>
                </header>

                <EditCardForm deckId={deckId} card={card} />
            </main>
        </div>
    );
}
