"use client";

import { useState, useEffect, useMemo } from "react";
import CreateDeckForm from "./CreateDeckForm";
import CreateFolderForm, { NewFolder } from "./folders/CreateFolderForm";
import FolderItem, { FolderData } from "./folders/FolderItem";
import DeckList from "./DeckList";

interface Deck {
    id: string;
    title: string;
    deck_seq: number | null;
    folder_id: string | null;
    _count: { cards: number };
}

interface DeckManagerProps {
    initialDecks: Deck[];
    initialFolders: FolderData[];
}

const EXPANDED_KEY = "creator-expanded-folders";

export default function DeckManager({ initialDecks, initialFolders }: DeckManagerProps) {
    const [decks, setDecks] = useState<Deck[]>(initialDecks);
    const [folders, setFolders] = useState<FolderData[]>(initialFolders);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setDecks(initialDecks);
    }, [initialDecks]);

    useEffect(() => {
        setFolders(initialFolders);
    }, [initialFolders]);

    // Restore expanded state from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(EXPANDED_KEY);
            if (stored) setExpanded(JSON.parse(stored));
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        try {
            sessionStorage.setItem(EXPANDED_KEY, JSON.stringify(expanded));
        } catch {
            /* ignore */
        }
    }, [expanded]);

    // Deck handlers
    const handleDeckCreated = (newDeck: Deck) => {
        setDecks((prev) => {
            const updated = [...prev, { ...newDeck, _count: { cards: 0 } }];
            return updated.sort((a, b) => a.title.localeCompare(b.title));
        });
        // Auto-expand the target folder so the new deck is immediately visible
        if (newDeck.folder_id) {
            setExpanded((prev) => ({ ...prev, [newDeck.folder_id!]: true }));
        }
    };

    const handleDeleteDeck = (deletedId: string) => {
        setDecks((prev) => prev.filter((d) => d.id !== deletedId));
    };

    const handleUpdateDeck = (updatedId: string, newTitle: string) => {
        setDecks((prev) => {
            const updated = prev.map((d) => (d.id === updatedId ? { ...d, title: newTitle } : d));
            return updated.sort((a, b) => a.title.localeCompare(b.title));
        });
    };

    const handleMoveDeck = (deckId: string, folderId: string | null) => {
        setDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, folder_id: folderId } : d)));
    };

    // Folder handlers
    const handleFolderCreated = (folder: NewFolder) => {
        setFolders((prev) => {
            const updated = [...prev, { ...folder, _count: { decks: 0 } }];
            return updated.sort((a, b) => a.title.localeCompare(b.title));
        });
        setExpanded((prev) => ({ ...prev, [folder.id]: true }));
    };

    const handleDeleteFolder = (folderId: string) => {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        // Decks lose their folder association (server-side SetNull handles this)
        setDecks((prev) => prev.map((d) => (d.folder_id === folderId ? { ...d, folder_id: null } : d)));
    };

    const handleUpdateFolder = (folderId: string, newTitle: string) => {
        setFolders((prev) => {
            const updated = prev.map((f) => (f.id === folderId ? { ...f, title: newTitle } : f));
            return updated.sort((a, b) => a.title.localeCompare(b.title));
        });
    };

    // Group decks by folder
    const { decksByFolder, uncategorizedDecks } = useMemo(() => {
        const byFolder: Record<string, Deck[]> = {};
        const uncategorized: Deck[] = [];
        for (const deck of decks) {
            if (deck.folder_id) {
                (byFolder[deck.folder_id] ||= []).push(deck);
            } else {
                uncategorized.push(deck);
            }
        }
        return { decksByFolder: byFolder, uncategorizedDecks: uncategorized };
    }, [decks]);

    const toggleFolder = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    // Folder names list for the move-to-folder menu on each deck + new-deck selector
    const folderOptions = folders.map((f) => ({ id: f.id, title: f.title }));

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <CreateDeckForm folders={folderOptions} onDeckCreated={handleDeckCreated} />
                <CreateFolderForm onFolderCreated={handleFolderCreated} />
            </div>

            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold border-b border-border pb-2">Your Library</h2>

                {/* Folders */}
                {folders.length > 0 && (
                    <div className="space-y-3">
                        {folders.map((folder) => {
                            const folderDecks = decksByFolder[folder.id] || [];
                            return (
                                <FolderItem
                                    key={folder.id}
                                    folder={folder}
                                    isExpanded={expanded[folder.id] ?? false}
                                    onToggle={() => toggleFolder(folder.id)}
                                    onDelete={handleDeleteFolder}
                                    onUpdate={handleUpdateFolder}
                                    deckCount={folderDecks.length}
                                >
                                    {folderDecks.length === 0 ? (
                                        <p className="text-muted-foreground text-sm text-center py-6">
                                            No decks in this folder yet. Move a deck here from below.
                                        </p>
                                    ) : (
                                        <DeckList
                                            decks={folderDecks}
                                            folders={folderOptions}
                                            onDelete={handleDeleteDeck}
                                            onUpdate={handleUpdateDeck}
                                            onMove={handleMoveDeck}
                                            compact
                                        />
                                    )}
                                </FolderItem>
                            );
                        })}
                    </div>
                )}

                {/* Uncategorized decks */}
                <div className="pt-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        {folders.length > 0 ? "Uncategorized" : "All Decks"}
                    </h3>
                    <DeckList
                        decks={uncategorizedDecks}
                        folders={folderOptions}
                        onDelete={handleDeleteDeck}
                        onUpdate={handleUpdateDeck}
                        onMove={handleMoveDeck}
                    />
                </div>
            </div>
        </section>
    );
}
