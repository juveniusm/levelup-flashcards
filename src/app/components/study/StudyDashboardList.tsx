"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ArrowUpDown, ChevronDown, Folder as FolderIcon } from "lucide-react";
import StudyDeckCard from "./StudyDeckCard";

export interface DashboardDeck {
    id: string;
    title: string;
    folder_id?: string | null;
    _count: { cards: number };
    dueCount: number;
}

export interface DashboardFolder {
    id: string;
    title: string;
    _count: { decks: number };
}

interface StudyDashboardListProps {
    decks: DashboardDeck[];
    folders?: DashboardFolder[];
}

type SortOption = "TITLE_ASC" | "TITLE_DESC" | "CARDS_DESC" | "CARDS_ASC" | "DUE_DESC";

const SORT_LABELS: Record<SortOption, string> = {
    TITLE_ASC: "A - Z",
    TITLE_DESC: "Z - A",
    CARDS_DESC: "Most Cards",
    CARDS_ASC: "Least Cards",
    DUE_DESC: "Highest Priority"
};

const EXPANDED_KEY = "study-expanded-folders";

export default function StudyDashboardList({ decks, folders = [] }: StudyDashboardListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("TITLE_ASC");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

    // Restore expanded state
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

    const sortDecks = (list: DashboardDeck[]) => [...list].sort((a, b) => {
        switch (sortBy) {
            case "TITLE_ASC": return a.title.localeCompare(b.title);
            case "TITLE_DESC": return b.title.localeCompare(a.title);
            case "CARDS_DESC": return b._count.cards - a._count.cards;
            case "CARDS_ASC": return a._count.cards - b._count.cards;
            case "DUE_DESC": return b.dueCount - a.dueCount;
            default: return 0;
        }
    });

    const filteredAndSortedDecks = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const result = decks.filter((deck) => deck.title.toLowerCase().includes(q));
        return sortDecks(result);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [decks, searchQuery, sortBy]);

    // Group: when there is no search, show folders as groups. While searching, show a flat list.
    const { decksByFolder, uncategorizedDecks } = useMemo(() => {
        const byFolder: Record<string, DashboardDeck[]> = {};
        const uncategorized: DashboardDeck[] = [];
        for (const deck of filteredAndSortedDecks) {
            if (deck.folder_id) {
                (byFolder[deck.folder_id] ||= []).push(deck);
            } else {
                uncategorized.push(deck);
            }
        }
        return { decksByFolder: byFolder, uncategorizedDecks: uncategorized };
    }, [filteredAndSortedDecks]);

    const showGroups = folders.length > 0 && searchQuery.trim() === "";
    const toggleFolder = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-border pb-4 gap-4">
                <h2 className="text-2xl font-bold">All Study Decks</h2>

                {decks.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Search Input */}
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-gold transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search decks..."
                                className="w-full bg-card border border-border focus:border-gold focus:ring-2 focus:ring-gold/30 rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Custom Sort Dropdown */}
                        <div className="relative w-full sm:w-auto min-w-[180px]" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full bg-card border ${isDropdownOpen ? 'border-gold' : 'border-border'} hover:border-gold/40 rounded-lg px-4 py-2 text-foreground text-left focus:outline-none transition-all cursor-pointer text-sm flex justify-between items-center h-[42px]`}
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className={`w-4 h-4 ${isDropdownOpen ? 'text-gold' : 'text-muted-foreground'}`} />
                                    <span className="truncate">{SORT_LABELS[sortBy]}</span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-card border border-border rounded-lg shadow-2xl overflow-hidden py-1 z-30 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                setSortBy(key);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted flex items-center gap-2 ${sortBy === key ? 'text-foreground bg-gold-soft/50 font-medium' : 'text-muted-foreground'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${sortBy === key ? 'bg-gold' : 'bg-transparent'}`} />
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
                <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
                    <p className="text-muted-foreground">You don&apos;t have any decks yet. Create one to get started.</p>
                </div>
            ) : filteredAndSortedDecks.length === 0 ? (
                <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium text-lg">No decks found for &quot;{searchQuery}&quot;</p>
                    <p className="text-muted-foreground text-sm mt-1">Try a different search term.</p>
                </div>
            ) : showGroups ? (
                <div className="space-y-4">
                    {folders.map((folder) => {
                        const folderDecks = decksByFolder[folder.id] || [];
                        if (folderDecks.length === 0) return null;
                        const isOpen = expanded[folder.id] ?? true;
                        return (
                            <div key={folder.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleFolder(folder.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 gap-3 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                                        <FolderIcon className="w-5 h-5 text-gold flex-shrink-0" />
                                        <h3 className="font-semibold text-foreground truncate">{folder.title}</h3>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {folderDecks.length} {folderDecks.length === 1 ? "deck" : "decks"}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="border-t border-border p-3 flex flex-col gap-3 bg-secondary/40">
                                        {folderDecks.map((deck) => (
                                            <StudyDeckCard key={deck.id} deck={deck as never} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {uncategorizedDecks.length > 0 && (
                        <div className="pt-2">
                            {folders.length > 0 && (
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Uncategorized
                                </h3>
                            )}
                            <div className="flex flex-col gap-3">
                                {uncategorizedDecks.map((deck) => (
                                    <StudyDeckCard key={deck.id} deck={deck as never} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredAndSortedDecks.map((deck) => (
                        <StudyDeckCard key={deck.id} deck={deck as never} />
                    ))}
                </div>
            )}
        </div>
    );
}
