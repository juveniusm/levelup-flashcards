"use client";

import { useState, useEffect } from "react";
import CreateDeckForm from "./CreateDeckForm";
import DeckList from "./DeckList";

interface Deck {
    id: string;
    title: string;
    deck_seq: number | null;
    _count: { cards: number };
}

interface DeckManagerProps {
    initialDecks: Deck[];
}

export default function DeckManager({ initialDecks }: DeckManagerProps) {
    const [decks, setDecks] = useState<Deck[]>(initialDecks);

    useEffect(() => {
        setDecks(initialDecks);
    }, [initialDecks]);

    const handleDeckCreated = (newDeck: Deck) => {
        // Ensure the new deck matches the expected Deck interface format
        const formattedDeck = {
            ...newDeck,
            _count: { cards: 0 } // Newly created decks have 0 cards
        };

        // Add the new deck to the beginning of the list, or sort it alphabetically
        setDecks(prevDecks => {
            const updated = [...prevDecks, formattedDeck];
            // Match the Prisma sorting from page.tsx: title "asc"
            return updated.sort((a, b) => a.title.localeCompare(b.title));
        });
    };

    const handleDeleteDeck = (deletedId: string) => {
        setDecks(prevDecks => prevDecks.filter(d => d.id !== deletedId));
    };

    const handleUpdateDeck = (updatedId: string, newTitle: string) => {
        setDecks(prevDecks => {
            const updated = prevDecks.map(d => d.id === updatedId ? { ...d, title: newTitle } : d);
            return updated.sort((a, b) => a.title.localeCompare(b.title));
        });
    };

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <CreateDeckForm onDeckCreated={handleDeckCreated} />
            </div>

            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">Your Decks</h2>
                {/* We pass the lifted state 'decks' into a controlled version of DeckList, 
                    OR we modify DeckList to accept decks as a direct prop instead of initialDecks */}
                <DeckList
                    decks={decks}
                    onDelete={handleDeleteDeck}
                    onUpdate={handleUpdateDeck}
                />
            </div>
        </section>
    );
}
