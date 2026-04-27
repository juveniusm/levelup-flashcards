"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Trash2, X } from "lucide-react";
import FlashcardItem from "./FlashcardItem";
import { db } from "@/lib/indexedDB";

interface FlashcardListProps {
    deckId: string;
    deckSeq?: number | null;
    cards: Array<{
        id: string;
        front: string;
        back: string;
        card_seq?: number | null;
    }>;
}

export default function FlashcardList({ deckId, deckSeq, cards }: FlashcardListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<'all' | 'prompt' | 'answer' | 'id'>('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 20;

    // Bulk-select state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

    const searchTypeLabels: Record<'all' | 'prompt' | 'answer' | 'id', string> = {
        all: "Search All Fields",
        prompt: "Prompt Only",
        answer: "Answer Only",
        id: "ID Only"
    };

    // First filter
    const filteredCards = cards.filter((card) => {
        const query = searchQuery.toLowerCase();

        // Skip filtering if query is empty
        if (!query) return true;

        const displayId = deckSeq && card.card_seq
            ? `${String(deckSeq).padStart(3, '0')}${String(card.card_seq).padStart(4, '0')}`
            : card.id.toLowerCase();

        if (searchType === 'prompt') return card.front.toLowerCase().includes(query);
        if (searchType === 'answer') return card.back.toLowerCase().includes(query);
        if (searchType === 'id') return displayId.includes(query);

        // Default 'all'
        return (
            card.front.toLowerCase().includes(query) ||
            card.back.toLowerCase().includes(query) ||
            displayId.includes(query)
        );
    });

    // Then paginate
    const totalPages = Math.ceil(filteredCards.length / cardsPerPage) || 1;
    const startIndex = (currentPage - 1) * cardsPerPage;
    const paginatedCards = filteredCards.slice(startIndex, startIndex + cardsPerPage);

    // Handle pagination bounds
    if (currentPage > totalPages) {
        setCurrentPage(totalPages);
    }

    // ── Select-mode handlers ────────────────────────────────────────────
    const toggleSelectMode = () => {
        setSelectMode((prev) => {
            if (prev) setSelectedIds(new Set()); // exiting clears selection
            return !prev;
        });
    };

    const toggleCardSelection = (cardId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(cardId)) next.delete(cardId);
            else next.add(cardId);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} flashcard(s)? This cannot be undone.`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch(`/api/decks/${deckId}/cards/bulk-delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardIds: Array.from(selectedIds) }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to delete cards");
            }

            try { await db?.offlineDecks?.delete(deckId); } catch { /* ignore */ }

            setSelectedIds(new Set());
            setSelectMode(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "An error occurred during bulk delete.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {cards.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-lg">
                    <p className="text-neutral-400">This deck is empty. Add a flashcard to start learning.</p>
                </div>
            ) : (
                <>
                    {selectMode ? (
                        // Select-mode toolbar
                        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center justify-between bg-neutral-900 border border-[#f9c111]/40 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3">
                                <CheckSquare className="w-5 h-5 text-[#f9c111]" />
                                <span className="text-white font-semibold text-sm">
                                    {selectedIds.size} selected
                                </span>
                                <span className="text-neutral-500 text-xs hidden sm:inline">
                                    Click cards to select
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleSelectMode}
                                    disabled={isBulkDeleting}
                                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.size === 0 || isBulkDeleting}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isBulkDeleting ? "Deleting..." : `Delete${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Normal search/filter toolbar
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
                                    placeholder={`Search by ${searchType === 'all' ? 'prompt, answer, or ID' : searchType}...`}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1); // Reset to first page on new search
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all text-sm"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={toggleSelectMode}
                                className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[46px]"
                                title="Select multiple cards"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Select
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {paginatedCards.length === 0 ? (
                            <p className="text-neutral-400 text-center py-8">No flashcards found matching your search.</p>
                        ) : (
                            paginatedCards.map((card) => (
                                <FlashcardItem
                                    key={card.id}
                                    deckId={deckId}
                                    deckSeq={deckSeq}
                                    card={card}
                                    selectMode={selectMode}
                                    selected={selectedIds.has(card.id)}
                                    onToggleSelect={toggleCardSelection}
                                />
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-4 border-t border-neutral-800">
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
