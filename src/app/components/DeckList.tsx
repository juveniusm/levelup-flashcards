"use client";

import { useState, useRef, useEffect } from "react";
import DeckItem from "./DeckItem";

interface Deck {
    id: string;
    title: string;
    deck_seq: number | null;
    folder_id?: string | null;
    _count: { cards: number };
}

interface FolderOption {
    id: string;
    title: string;
}

interface DeckListProps {
    decks: Deck[];
    onDelete: (id: string) => void;
    onUpdate: (id: string, newTitle: string) => void;
    folders?: FolderOption[];
    onMove?: (deckId: string, folderId: string | null) => void;
    compact?: boolean;
}

export default function DeckList({ decks, onDelete, onUpdate, folders, onMove, compact }: DeckListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<'all' | 'title' | 'id'>('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const decksPerPage = 12;

    const searchTypeLabels: Record<'all' | 'title' | 'id', string> = {
        all: "Search All Fields",
        title: "Title Only",
        id: "ID Only"
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Logic
    const filteredDecks = decks.filter((deck) => {
        const query = searchQuery.toLowerCase();

        if (!query) return true;

        const displayId = deck.deck_seq ? String(deck.deck_seq).padStart(3, '0') : deck.id.toLowerCase();

        if (searchType === 'title') return deck.title.toLowerCase().includes(query);
        if (searchType === 'id') return displayId.includes(query);

        // Default 'all'
        return (
            deck.title.toLowerCase().includes(query) ||
            displayId.includes(query)
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredDecks.length / decksPerPage) || 1;
    const startIndex = (currentPage - 1) * decksPerPage;
    const paginatedDecks = filteredDecks.slice(startIndex, startIndex + decksPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div className="space-y-6">
            {decks.length === 0 ? (
                <div className={compact ? "text-muted-foreground text-sm text-center py-6" : "bg-card border border-border rounded-2xl p-12 text-center shadow-sm"}>
                    <p className={compact ? "" : "text-muted-foreground"}>
                        {compact ? "No decks here." : "You don't have any decks yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <>
                    {!compact && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 relative z-10">
                        {/* Custom Dropdown */}
                        <div className="relative sm:w-48 z-20" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full bg-card border ${isDropdownOpen ? 'border-gold' : 'border-border'} hover:border-gold/40 rounded-lg px-4 py-3 text-foreground text-left focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all cursor-pointer text-sm flex justify-between items-center h-full min-h-[46px]`}
                            >
                                <span className="truncate pr-2">{searchTypeLabels[searchType]}</span>
                                <svg className={`flex-shrink-0 w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1 z-30 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(Object.keys(searchTypeLabels) as Array<keyof typeof searchTypeLabels>).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                setSearchType(key);
                                                setCurrentPage(1);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted flex items-center gap-2 ${searchType === key ? 'text-foreground bg-gold-soft/50 font-medium' : 'text-muted-foreground'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${searchType === key ? 'bg-gold' : 'bg-transparent'}`} />
                                            {searchTypeLabels[key]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder={`Search by ${searchType === 'all' ? 'title or ID' : searchType}...`}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all text-sm"
                            />
                        </div>
                    </div>
                    )}

                    <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"} gap-4 lg:gap-6`}>
                        {paginatedDecks.length === 0 ? (
                            <div className="col-span-full">
                                <p className="text-muted-foreground text-center py-8">No decks found matching your search.</p>
                            </div>
                        ) : (
                            paginatedDecks.map((deck) => (
                                <DeckItem
                                    key={deck.id}
                                    deck={deck}
                                    folders={folders}
                                    onDelete={onDelete}
                                    onUpdate={onUpdate}
                                    onMove={onMove}
                                />
                            ))
                        )}
                    </div>

                    {!compact && totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-4 border-t border-border mt-8">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-card transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-muted-foreground text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-card transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
