"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Deck {
    id: string;
    title: string;
    deck_seq: number | null;
    _count: { cards: number };
}

interface DeckItemProps {
    deck: Deck;
    onDelete: (id: string) => void;
    onUpdate: (id: string, newTitle: string) => void;
}

export default function DeckItem({ deck, onDelete, onUpdate }: DeckItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(deck.title);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const router = useRouter();

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
        <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-300 rounded-xl p-5 group flex flex-col h-full shadow-lg hover:shadow-[#f9c111]/10 relative">

            <div className={`absolute top-4 right-4 flex gap-2 z-10 transition-opacity duration-200 ${showConfirmDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {!isEditing && (
                    <>
                        {!showConfirmDelete && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                                title="Edit Deck Title"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        )}

                        {showConfirmDelete ? (
                            <div className="flex bg-neutral-800 rounded-md border border-red-900/50 overflow-hidden shadow-lg animate-in slide-in-from-right-2 fade-in duration-200">
                                <button
                                    type="button"
                                    onClick={cancelDelete}
                                    className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 font-bold transition disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isDeleting ? "..." : "Confirm"}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-50"
                                title="Delete Deck"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="mb-2 border-b border-neutral-800/50 pb-2 flex justify-between items-center mt-1">
                <span className="text-[10px] text-[#f9c111] font-mono tracking-widest font-bold">DECK #{displayId}</span>
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
                            className="w-full bg-black border border-[#f9c111] rounded-md px-3 py-1.5 text-white font-semibold text-lg focus:outline-none mb-1 disabled:opacity-50"
                        />
                        <div className="flex gap-2 text-xs">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="text-green-500 hover:text-green-400 font-medium"
                            >
                                {isSaving ? "Saving..." : "Save (Enter)"}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setEditTitle(deck.title); }}
                                disabled={isSaving}
                                className="text-neutral-500 hover:text-white"
                            >
                                Cancel (Esc)
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link href={`/creator/${deck.id}`} className="block">
                        <h3 className="font-semibold text-lg text-white group-hover:text-[#f9c111] transition-colors leading-tight pr-12 line-clamp-2">
                            {deck.title}
                        </h3>
                    </Link>
                )}
            </div>

            <div className="mt-6 flex justify-between items-center text-sm text-neutral-400">
                <span className="bg-black px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                    {deck._count.cards} Cards
                </span>
                <Link href={`/creator/${deck.id}`}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium text-[#f9c111] hover:text-white">
                        Manage Deck <span>&rarr;</span>
                    </span>
                </Link>
            </div>
        </div>
    );
}
