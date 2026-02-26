"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

// Form Validation Schema
const deckSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
});

type DeckFormValues = z.infer<typeof deckSchema>;

export default function CreateDeckForm({ onDeckCreated }: { onDeckCreated?: (deck: { id: string; title: string; deck_seq: number | null; _count: { cards: number } }) => void }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<DeckFormValues>({
        resolver: zodResolver(deckSchema),
    });

    const onSubmit = async (data: DeckFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/decks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title: data.title }),
            });

            if (!response.ok) {
                throw new Error("Failed to create deck");
            }

            const newDeck = await response.json();

            reset();
            if (onDeckCreated) {
                onDeckCreated(newDeck);
            }
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Deck</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-neutral-400 mb-1">
                        Deck Title
                    </label>
                    <input
                        {...register("title")}
                        id="title"
                        type="text"
                        placeholder="e.g. Neuroscience 101"
                        className={`w-full bg-neutral-950 border ${errors.title ? "border-red-500" : "border-neutral-800"
                            } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all`}
                    />
                    {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#f9c111] hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Creating..." : "Create Deck"}
                </button>
            </form>
        </div>
    );
}
