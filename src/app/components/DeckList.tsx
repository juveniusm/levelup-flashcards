"use client";

import { useState, useRef, useEffect } from "react";
import DeckItem from "./DeckItem";

interface Deck {
    id: string;
    title: string;
    deck_seq: number | null;
    _count: { cards: number };
}

interface DeckListProps {
    decks: Deck[];
    onDelete: (id: string) => void;
    onUpdate: (id: string, newTitle: string) => void;
}

export default function DeckList({ decks, onDelete, onUpdate }: DeckListProps) {
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

    if (currentPage > totalPages) {
        setCurrentPage(totalPages);
    }

    return (
        <div className="space-y-6">
            {decks.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-lg">
                    <p className="text-neutral-400">You don&apos;t have any decks yet. Create one to get started.</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 relative z-10">
                        {/* Custom Dropdown */}
                        <div className="relative sm:w-48 z-20" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full bg-neutral-900 border ${isDropdownOpen ? 'border-[#f9c111]' : 'border-neutral-800'} hover:border-neutral-700 rounded-lg px-4 py-3 text-white text-left focus:outline-none focus:ring-2 focus:ring-[#f9c111]/50 transition-all cursor-pointer text-sm flex justify-between items-center h-full min-h-[46px]`}
                            >
                                <span className="truncate pr-2">{searchTypeLabels[searchType]}</span>
                                <svg className={`flex-shrink-0 w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden py-1 z-30 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(Object.keys(searchTypeLabels) as Array<keyof typeof searchTypeLabels>).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                setSearchType(key);
                                                setCurrentPage(1);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-neutral-800/80 flex items-center gap-2 ${searchType === key ? 'text-[#f9c111] bg-neutral-800/40 font-medium' : 'text-neutral-300'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${searchType === key ? 'bg-[#f9c111]' : 'bg-transparent'}`} />
                                            {searchTypeLabels[key]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {paginatedDecks.length === 0 ? (
                            <div className="col-span-full">
                                <p className="text-neutral-400 text-center py-8">No decks found matching your search.</p>
                            </div>
                        ) : (
                            paginatedDecks.map((deck) => (
                                <DeckItem
                                    key={deck.id}
                                    deck={deck}
                                    onDelete={onDelete}
                                    onUpdate={onUpdate}
                                />
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-4 border-t border-neutral-800 mt-8">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-900 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-neutral-400 text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-900 transition-colors"
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
