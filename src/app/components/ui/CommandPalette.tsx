"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Loader2, BookOpen, Edit3, ChevronRight } from "lucide-react";
import { Card } from "@/utils/study/studyUtils";

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle logic (Ctrl+K and Custom Event)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        const handleOpenEvent = () => setIsOpen(true);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("open-command-palette", handleOpenEvent);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("open-command-palette", handleOpenEvent);
        };
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSelectedIndex(0);
        } else {
            setQuery("");
            setResults([]);
            setCursor(null);
        }
    }, [isOpen]);

    // Search logic with debouncing
    const fetchResults = useCallback(async (searchQuery: string, currentCursor: string | null = null) => {
        if (!searchQuery.trim() && !currentCursor) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const url = `/api/cards/search?q=${encodeURIComponent(searchQuery)}&limit=10${currentCursor ? `&cursor=${currentCursor}` : ""}`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (currentCursor) {
                setResults(prev => [...prev, ...data.cards]);
            } else {
                setResults(data.cards);
            }
            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) fetchResults(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, isOpen, fetchResults]);

    // Infinite Scroll logic
    const handleScroll = () => {
        if (!scrollContainerRef.current || loading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            fetchResults(query, cursor);
        }
    };

    // Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && results[selectedIndex]) {
            handleAction("edit", results[selectedIndex]);
        }
    };

    const handleAction = (type: "edit" | "view", card: Card) => {
        const deckId = card.deck_id;
        if (type === "edit" || type === "view") {
            // Open in a new tab so the user's current session (e.g. an
            // active study run) keeps running in the original tab.
            // Must be called synchronously from a user gesture or popup
            // blockers will eat it.
            window.open(
                `/creator/${deckId}/cards/${card.id}/edit`,
                "_blank",
                "noopener,noreferrer"
            );
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] p-4 sm:p-6 md:p-8">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setIsOpen(false)}
            />
            
            {/* Modal */}
            <div 
                className="relative w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300"
                onKeyDown={handleKeyDown}
            >
                {/* Search Header */}
                <div className="flex items-center px-4 py-4 border-b border-neutral-800 bg-[#1a1a1a]">
                    <Search className="text-neutral-500 mr-3" size={20} />
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Search for cards (front or back contents)..."
                        className="flex-1 bg-transparent border-none text-white focus:outline-none text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && <Loader2 className="animate-spin text-[#f9c111] mr-2" size={18} />}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700 font-mono">ESC to close</span>
                        <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white ml-2">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar"
                >
                    {results.length > 0 ? (
                        <>
                            {results.map((card, idx) => (
                                <div 
                                    key={card.id}
                                    onClick={() => handleAction("edit", card)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`group flex items-start p-4 rounded-xl transition-all cursor-pointer border ${
                                        selectedIndex === idx 
                                            ? "bg-[#f9c111]/10 border-[#f9c111]/30 ring-1 ring-[#f9c111]/20" 
                                            : "bg-transparent border-transparent hover:bg-neutral-800/50"
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg mr-4 ${
                                        selectedIndex === idx ? "bg-[#f9c111] text-black" : "bg-neutral-800 text-neutral-400"
                                    }`}>
                                        <BookOpen size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                                                {(card as any).deck?.title || "Untitled Deck"}
                                            </span>
                                            <ChevronRight size={10} className="text-neutral-700" />
                                        </div>
                                        <h4 className="text-white font-medium truncate mb-1">{card.front}</h4>
                                        <p className="text-neutral-500 text-sm truncate">{card.back}</p>
                                    </div>
                                    <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedIndex === idx ? "opacity-100" : ""}`}>
                                        <button 
                                            className="p-2 text-neutral-400 hover:text-[#f9c111] hover:bg-[#f9c111]/10 rounded-lg"
                                            title="Edit Card"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {hasMore && (
                                <div className="p-4 text-center text-xs text-neutral-600 animate-pulse">
                                    Scroll for more...
                                </div>
                            )}
                        </>
                    ) : (
                        query && !loading && (
                            <div className="py-12 text-center">
                                <Search className="mx-auto text-neutral-800 mb-4" size={48} />
                                <p className="text-neutral-500">No cards found matching &quot;{query}&quot;</p>
                            </div>
                        )
                    )}

                    {!query && (
                        <div className="py-12 text-center text-neutral-600">
                            <p className="text-sm">Type something to search across all your decks.</p>
                        </div>
                    )}
                </div>

                {/* Footer Advice */}
                <div className="p-3 bg-neutral-900/50 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-500 font-medium">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <span className="bg-neutral-800 p-0.5 rounded border border-neutral-700 px-1">↑↓</span> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="bg-neutral-800 p-0.5 rounded border border-neutral-700 px-1">ENTER</span> Select
                        </span>
                    </div>
                    {results.length > 0 && <span>{results.length} results found</span>}
                </div>
            </div>
        </div>
    );
}
