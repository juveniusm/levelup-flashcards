"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderInput } from "lucide-react";

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

interface DeckItemProps {
    deck: Deck;
    onDelete: (id: string) => void;
    onUpdate: (id: string, newTitle: string) => void;
    folders?: FolderOption[];
    onMove?: (deckId: string, folderId: string | null) => void;
}

export default function DeckItem({ deck, onDelete, onUpdate, folders, onMove }: DeckItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(deck.title);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const moveMenuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moveMenuRef.current && !moveMenuRef.current.contains(event.target as Node)) {
                setIsMoveMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMove = async (folderId: string | null) => {
        if (!onMove) return;
        setIsMoving(true);
        setIsMoveMenuOpen(false);
        try {
            const res = await fetch(`/api/decks/${deck.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder_id: folderId }),
            });
            if (!res.ok) throw new Error("Failed to move deck");
            onMove(deck.id, folderId);
            router.refresh();
        } catch {
            alert("Failed to move deck.");
        } finally {
            setIsMoving(false);
        }
    };

    const displayId = deck.deck_seq ? String(deck.deck_seq).padStart(3, '0') : deck.id;

    const handleSave = async () => {
        if (!editTitle.trim() || editTitle === deck.title) {
            setIsEditing(false);
            setEditTitle(deck.title);
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/decks/${deck.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle.trim() }),
            });

            if (!res.ok) throw new Error("Failed to update deck");

            onUpdate(deck.id, editTitle.trim());
            setIsEditing(false);
            router.refresh();
        } catch {
            alert("Failed to update deck.");
            setEditTitle(deck.title);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!showConfirmDelete) {
            setShowConfirmDelete(true);
            return;
        }

        executeDelete();
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmDelete(false);
    };

    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/decks/${deck.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete deck");

            // Optimistically remove from UI
            onDelete(deck.id);
            // Refresh Next.js router cache in the background
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to delete deck.");
        } finally {
            setIsDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setIsEditing(false);
            setEditTitle(deck.title);
        }
    };

    return (
        <div className="bg-card border border-border hover:border-gold/40 transition-all duration-300 rounded-2xl p-5 group flex flex-col h-full shadow-sm hover:shadow-md relative">

            <div className={`absolute top-4 right-4 flex gap-2 z-10 transition-opacity duration-200 ${showConfirmDelete || isMoveMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {!isEditing && (
                    <>
                        {!showConfirmDelete && onMove && folders !== undefined && (
                            <div className="relative" ref={moveMenuRef}>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setIsMoveMenuOpen((v) => !v); }}
                                    disabled={isMoving}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                                    title="Move to folder"
                                >
                                    <FolderInput className="w-4 h-4" />
                                </button>
                                {isMoveMenuOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                                            Move to
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleMove(null); }}
                                            disabled={!deck.folder_id}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted flex items-center gap-2 ${!deck.folder_id ? 'text-muted-foreground/50 cursor-default' : 'text-muted-foreground'}`}
                                        >
                                            <span className="w-4 h-4 rounded border border-border flex-shrink-0" />
                                            <span className="truncate">Uncategorized</span>
                                        </button>
                                        {folders.length === 0 ? (
                                            <p className="px-3 py-2 text-xs text-muted-foreground italic">
                                                Create a folder first.
                                            </p>
                                        ) : (
                                            folders.map((f) => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); handleMove(f.id); }}
                                                    disabled={deck.folder_id === f.id}
                                                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted flex items-center gap-2 ${deck.folder_id === f.id ? 'text-foreground font-medium cursor-default' : 'text-muted-foreground'}`}
                                                >
                                                    <span className={`w-4 h-4 rounded flex-shrink-0 ${deck.folder_id === f.id ? 'bg-gold' : 'border border-border'}`} />
                                                    <span className="truncate">{f.title}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {!showConfirmDelete && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                title="Edit Deck Title"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        )}

                        {showConfirmDelete ? (
                            <div className="flex bg-secondary rounded-md border border-destructive/40 overflow-hidden shadow-lg animate-in slide-in-from-right-2 fade-in duration-200">
                                <button
                                    type="button"
                                    onClick={cancelDelete}
                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 text-xs text-destructive-foreground bg-destructive hover:bg-destructive/90 font-bold transition disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isDeleting ? "..." : "Confirm"}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                                title="Delete Deck"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="mb-2 border-b border-border pb-2 flex justify-between items-center mt-1">
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest font-bold">DECK #{displayId}</span>
            </div>

            <div className="flex-1 mt-2">
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isSaving}
                            className="w-full bg-background border border-gold rounded-md px-3 py-1.5 text-foreground font-semibold text-lg focus:outline-none mb-1 disabled:opacity-50"
                        />
                        <div className="flex gap-2 text-xs">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-700 font-medium"
                            >
                                {isSaving ? "Saving..." : "Save (Enter)"}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setEditTitle(deck.title); }}
                                disabled={isSaving}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancel (Esc)
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link href={`/creator/${deck.id}`} className="block">
                        <h3 className="font-display font-semibold text-lg text-foreground transition-colors leading-tight pr-12 line-clamp-2">
                            {deck.title}
                        </h3>
                    </Link>
                )}
            </div>

            <div className="mt-6 flex justify-between items-center text-sm text-muted-foreground">
                <span className="bg-secondary px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                    {deck._count.cards} Cards
                </span>
                <Link href={`/creator/${deck.id}`}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium text-foreground hover:text-gold">
                        Manage Deck <span>&rarr;</span>
                    </span>
                </Link>
            </div>
        </div>
    );
}
