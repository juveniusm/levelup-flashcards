"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

interface FlashcardItemProps {
    deckId: string;
    deckSeq?: number | null;
    card: {
        id: string;
        front: string;
        back: string;
        card_seq?: number | null;
    };
}

export default function FlashcardItem({ deckId, deckSeq, card }: FlashcardItemProps) {
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
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting the flashcard.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 shadow-sm transition-colors relative group">
            <div className="mb-3 border-b border-neutral-800/50 pb-2">
                <span className="text-[10px] text-[#f9c111] font-mono tracking-widest font-bold">ID: {displayId}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Prompt</span>
                    <p className="text-neutral-200">{card.front}</p>
                </div>
                <div>
                    <span className="text-xs text-[#f9c111] font-semibold uppercase tracking-wider mb-1 block">Target Answer</span>
                    <p className="text-white font-medium">{card.back}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                    href={`/creator/${deckId}/cards/${card.id}/edit`}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                    title="Edit Card"
                >
                    <Pencil size={18} />
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                    title="Delete Card"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
