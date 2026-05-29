"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Search, X, Loader2, BookOpen, Edit3, Trash2, ChevronRight } from "lucide-react";
import { Card } from "@/utils/study/studyUtils";

export default function CommandPalette() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle logic (Ctrl+K and Custom Event) — admin only
    useEffect(() => {
        if (!isAdmin) return;

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
    }, [isAdmin]);

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

    // Auto-clear the delete-confirm state after 3s so a stray first
    // click doesn't leave a trash button primed to delete.
    useEffect(() => {
        if (!confirmingDeleteId) return;
        const timer = setTimeout(() => setConfirmingDeleteId(null), 3000);
        return () => clearTimeout(timer);
    }, [confirmingDeleteId]);

    const handleDeleteClick = async (card: Card) => {
        if (confirmingDeleteId !== card.id) {
            setConfirmingDeleteId(card.id);
            return;
        }
        // Second click — actually delete
        setConfirmingDeleteId(null);
        setDeletingId(card.id);
        try {
            const res = await fetch(`/api/decks/${card.deck_id}/cards/${card.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? "Failed to delete card");
            }
            // Remove from results without closing the palette, so the
            // user can keep searching / deleting.
            setResults(prev => prev.filter(c => c.id !== card.id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert(err instanceof Error ? err.message : "Failed to delete card.");
        } finally {
            setDeletingId(null);
        }
    };

    if (!isAdmin || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] p-4 sm:p-6 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-md overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300"
                onKeyDown={handleKeyDown}
            >
                {/* Search Header */}
                <div className="flex items-center px-4 py-4 border-b border-border bg-muted">
                    <Search className="text-muted-foreground mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for cards (front or back contents)..."
                        className="flex-1 bg-transparent border-none text-foreground focus:outline-none text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && <Loader2 className="animate-spin text-gold mr-2" size={18} />}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-card text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">ESC to close</span>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground ml-2">
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
                                            ? "bg-gold-soft border-gold/30 ring-1 ring-gold/20"
                                            : "bg-transparent border-transparent hover:bg-muted"
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg mr-4 ${
                                        selectedIndex === idx ? "bg-gold text-foreground" : "bg-muted text-muted-foreground"
                                    }`}>
                                        <BookOpen size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                                {(card as any).deck?.title || "Untitled Deck"}
                                            </span>
                                            <ChevronRight size={10} className="text-muted-foreground/50" />
                                        </div>
                                        <h4 className="text-foreground font-medium truncate mb-1">{card.front}</h4>
                                        <p className="text-muted-foreground text-sm truncate">{card.back}</p>
                                    </div>
                                    <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedIndex === idx || confirmingDeleteId === card.id ? "opacity-100" : ""}`}>
                                        <button
                                            className="p-2 text-muted-foreground hover:text-gold hover:bg-gold/10 rounded-lg"
                                            title="Edit Card"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(card); }}
                                            disabled={deletingId === card.id}
                                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                                confirmingDeleteId === card.id
                                                    ? "text-destructive-foreground bg-destructive hover:bg-destructive/90 animate-pulse"
                                                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            }`}
                                            title={
                                                deletingId === card.id
                                                    ? "Deleting..."
                                                    : confirmingDeleteId === card.id
                                                        ? "Click again to confirm"
                                                        : "Delete Card"
                                            }
                                        >
                                            {deletingId === card.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {hasMore && (
                                <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                                    Scroll for more...
                                </div>
                            )}
                        </>
                    ) : (
                        query && !loading && (
                            <div className="py-12 text-center">
                                <Search className="mx-auto text-muted-foreground/40 mb-4" size={48} />
                                <p className="text-muted-foreground">No cards found matching &quot;{query}&quot;</p>
                            </div>
                        )
                    )}

                    {!query && (
                        <div className="py-12 text-center text-muted-foreground">
                            <p className="text-sm">Type something to search across all your decks.</p>
                        </div>
                    )}
                </div>

                {/* Footer Advice */}
                <div className="p-3 bg-muted/50 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <span className="bg-card p-0.5 rounded border border-border px-1">↑↓</span> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="bg-card p-0.5 rounded border border-border px-1">ENTER</span> Select
                        </span>
                    </div>
                    {results.length > 0 && <span>{results.length} results found</span>}
                </div>
            </div>
        </div>
    );
}
