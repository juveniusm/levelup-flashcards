"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ArrowUpDown, ChevronDown } from "lucide-react";
import StudyDeckCard from "./StudyDeckCard";

export interface DashboardDeck {
    id: string;
    title: string;
    _count: { cards: number };
    dueCount: number;
}

interface StudyDashboardListProps {
    decks: DashboardDeck[];
}

type SortOption = "TITLE_ASC" | "TITLE_DESC" | "CARDS_DESC" | "CARDS_ASC" | "DUE_DESC";

const SORT_LABELS: Record<SortOption, string> = {
    TITLE_ASC: "A - Z",
    TITLE_DESC: "Z - A",
    CARDS_DESC: "Most Cards",
    CARDS_ASC: "Least Cards",
    DUE_DESC: "Highest Priority"
};

export default function StudyDashboardList({ decks }: StudyDashboardListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("TITLE_ASC");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const filteredAndSortedDecks = useMemo(() => {
        // Filter
        let result = decks.filter(deck =>
            deck.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case "TITLE_ASC":
                    return a.title.localeCompare(b.title);
                case "TITLE_DESC":
                    return b.title.localeCompare(a.title);
                case "CARDS_DESC":
                    return b._count.cards - a._count.cards;
                case "CARDS_ASC":
                    return a._count.cards - b._count.cards;
                case "DUE_DESC":
                    return b.dueCount - a.dueCount;
                default:
                    return 0;
            }
        });

        return result;
    }, [decks, searchQuery, sortBy]);

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                <h2 className="text-2xl font-bold">All Study Decks</h2>

                {decks.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Search Input */}
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 group-focus-within:text-[#f9c111] transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search decks..."
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#f9c111] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none transition-colors shadow-inner"
                            />
                        </div>

                        {/* Custom Sort Dropdown */}
                        <div className="relative w-full sm:w-auto min-w-[180px]" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full bg-neutral-900 border ${isDropdownOpen ? 'border-[#f9c111]' : 'border-neutral-800'} hover:border-neutral-700 rounded-lg px-4 py-2 text-white text-left focus:outline-none transition-all cursor-pointer text-sm flex justify-between items-center h-[42px]`}
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className={`w-4 h-4 ${isDropdownOpen ? 'text-[#f9c111]' : 'text-neutral-500'}`} />
                                    <span className="truncate">{SORT_LABELS[sortBy]}</span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden py-1 z-30 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                setSortBy(key);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-neutral-800/80 flex items-center gap-2 ${sortBy === key ? 'text-[#f9c111] bg-neutral-800/40 font-medium' : 'text-neutral-300'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${sortBy === key ? 'bg-[#f9c111]' : 'bg-transparent'}`} />
                                            {SORT_LABELS[key]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {decks.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-lg">
                    <p className="text-neutral-400">You don&apos;t have any decks yet. Create one to get started.</p>
                </div>
            ) : filteredAndSortedDecks.length === 0 ? (
                <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-12 text-center">
                    <Search className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400 font-medium text-lg">No decks found for &quot;{searchQuery}&quot;</p>
                    <p className="text-neutral-500 text-sm mt-1">Try a different search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredAndSortedDecks.map((deck) => (
                        <StudyDeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            )}
        </div>
    );
}
