import { deckService } from "@/lib/services/deckService";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import CreateCardForm from "../../components/cards/CreateCardForm";
import DeleteDeckButton from "../../components/DeleteDeckButton";
import FlashcardList from "../../components/cards/FlashcardList";
import BulkImportCards from "../../components/BulkImportCards";

export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = await params;

    const user = await getAuthenticatedUser();
    const userId = user?.id;
    const userRole = user?.role;

    let deck;
    try {
        deck = await deckService.getDeckByIdWithCards(deckId);
    } catch (error) {
        console.error("Creator deck fetch error:", error);
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold text-destructive mb-4">Database Error</h1>
                    <p className="text-muted-foreground">We couldn&apos;t load this deck. This usually happens during database maintenance. Please try again in 30 seconds.</p>
                    <Link href="/creator" className="mt-6 inline-block text-foreground font-semibold hover:text-gold transition-colors">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    if (!deck) {
        notFound();
    }

    // Authorization check: Only owner or admin can manage
    if (deck.user_id !== userId && userRole !== "ADMIN") {
        notFound();
    }

    const displayDeckId = deck.deck_seq ? String(deck.deck_seq).padStart(3, '0') : '...';

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
                    <div>
                        <Link href="/creator" className="text-muted-foreground hover:text-foreground mb-2 inline-block transition-colors">
                            &larr; Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">{deck.title}</h1>
                        <p className="text-muted-foreground mt-2">{deck.cards.length} Cards in Deck</p>
                        <p className="text-muted-foreground text-xs mt-1 font-mono">Deck #{displayDeckId}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <DeleteDeckButton deckId={deck.id} />
                        {deck.cards.length > 0 && (
                            <Link
                                href={`/${deck.id}/study`}
                                className="bg-gold hover:bg-gold/90 text-foreground font-bold py-2 px-6 rounded-full transition-colors inline-block shadow-sm hover:shadow-md"
                            >
                                Study Deck
                            </Link>
                        )}
                    </div>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 sticky top-8 self-start">
                        <CreateCardForm deckId={deck.id} />
                        <BulkImportCards key={deck.id} deckId={deck.id} />
                    </div>

                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Flashcards</h2>

                        {deck.cards.length === 0 ? (
                            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
                                <p className="text-muted-foreground">This deck is empty. Add a flashcard to start learning.</p>
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
