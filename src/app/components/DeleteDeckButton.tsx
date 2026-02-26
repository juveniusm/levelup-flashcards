"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteDeckButton({ deckId }: { deckId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDeleteClick = async () => {
        if (!showConfirm) {
            setShowConfirm(true);
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/decks/${deckId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete deck");

            router.refresh();
            router.push("/creator");
        } catch (err) {
            console.error(err);
            alert("Failed to delete deck. Please try again.");
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {showConfirm && (
                <span className="text-sm text-red-500 font-medium animate-in fade-in mr-2">
                    Delete this deck?
                </span>
            )}
            {showConfirm && (
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            )}
            <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors inline-block disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isDeleting ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                    </>
                ) : showConfirm ? (
                    'Confirm Delete'
                ) : (
                    'Delete Deck'
                )}
            </button>
        </div>
    );
}
