"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Check } from "lucide-react";

import { db } from "@/lib/indexedDB";

interface FlashcardItemProps {
    deckId: string;
    deckSeq?: number | null;
    card: {
        id: string;
        front: string;
        back: string;
        card_seq?: number | null;
    };
    selectMode?: boolean;
    selected?: boolean;
    onToggleSelect?: (id: string) => void;
}

export default function FlashcardItem({ deckId, deckSeq, card, selectMode = false, selected = false, onToggleSelect }: FlashcardItemProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const displayId = deckSeq && card.card_seq
        ? `${String(deckSeq).padStart(3, '0')}${String(card.card_seq).padStart(4, '0')}`
        : '...';

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this flashcard?")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/decks/${deckId}/cards/${card.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete flashcard");
            }
            try { await db?.offlineDecks?.delete(deckId); } catch { /* ignore */ }
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting the flashcard.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCardClick = () => {
        if (selectMode && onToggleSelect) {
            onToggleSelect(card.id);
        }
    };

    const borderClass = selectMode && selected
        ? "border-gold"
        : "border-border hover:border-gold/40";

    return (
        <div
            onClick={handleCardClick}
            className={`bg-card border ${borderClass} rounded-2xl p-5 shadow-sm transition-colors relative group ${selectMode ? 'cursor-pointer select-none' : ''}`}
        >
            {/* Selection checkbox (only in select mode) */}
            {selectMode && (
                <div className="absolute top-4 left-4 z-10">
                    <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selected
                                ? 'bg-gold border-gold'
                                : 'bg-card border-border'
                        }`}
                    >
                        {selected && <Check size={14} className="text-foreground" strokeWidth={3} />}
                    </div>
                </div>
            )}

            <div className={`mb-3 border-b border-border pb-2 ${selectMode ? 'pl-8' : ''}`}>
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest font-bold">ID: {displayId}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">Prompt</span>
                    <p className="text-foreground">{card.front}</p>
                </div>
                <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">Target Answer</span>
                    <p className="text-foreground font-medium">{card.back}</p>
                </div>
            </div>

            {/* Actions (hidden in select mode) */}
            {!selectMode && (
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/creator/${deckId}/cards/${card.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Edit Card"
                    >
                        <Pencil size={18} />
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                        title="Delete Card"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
