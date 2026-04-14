"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Folder as FolderIcon, ChevronDown } from "lucide-react";

// Form Validation Schema
const deckSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
});

type DeckFormValues = z.infer<typeof deckSchema>;

interface FolderOption {
    id: string;
    title: string;
}

interface CreateDeckFormProps {
    folders?: FolderOption[];
    onDeckCreated?: (deck: { id: string; title: string; deck_seq: number | null; folder_id: string | null; _count: { cards: number } }) => void;
}

export default function CreateDeckForm({ folders = [], onDeckCreated }: CreateDeckFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
    const folderMenuRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<DeckFormValues>({
        resolver: zodResolver(deckSchema),
    });

    // Clear selection if the previously-picked folder disappears
    useEffect(() => {
        if (selectedFolderId && !folders.some((f) => f.id === selectedFolderId)) {
            setSelectedFolderId(null);
        }
    }, [folders, selectedFolderId]);

    // Click outside closes the dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
                setIsFolderMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedFolder = folders.find((f) => f.id === selectedFolderId);

    const onSubmit = async (data: DeckFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/decks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: data.title, folder_id: selectedFolderId }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error ?? "Failed to create deck");
            }

            const newDeck = await response.json();

            reset();
            onDeckCreated?.(newDeck);
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

                {/* Folder selector */}
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                        Folder <span className="text-neutral-600">(optional)</span>
                    </label>
                    <div className="relative" ref={folderMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsFolderMenuOpen((v) => !v)}
                            className={`w-full bg-neutral-950 border ${isFolderMenuOpen ? "border-[#f9c111]" : "border-neutral-800"} hover:border-neutral-700 rounded-lg px-4 py-2 text-white text-left focus:outline-none transition-all cursor-pointer text-sm flex justify-between items-center`}
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <FolderIcon className={`w-4 h-4 flex-shrink-0 ${selectedFolder ? "text-[#f9c111]" : "text-neutral-500"}`} />
                                <span className={`truncate ${selectedFolder ? "text-white" : "text-neutral-500"}`}>
                                    {selectedFolder ? selectedFolder.title : "No folder (Uncategorized)"}
                                </span>
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 flex-shrink-0 transition-transform ${isFolderMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isFolderMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden py-1 z-30 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedFolderId(null); setIsFolderMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-neutral-800/80 flex items-center gap-2 ${selectedFolderId === null ? "text-[#f9c111] bg-neutral-800/40 font-medium" : "text-neutral-300"}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedFolderId === null ? "bg-[#f9c111]" : "bg-transparent"}`} />
                                    No folder (Uncategorized)
                                </button>
                                {folders.length === 0 ? (
                                    <p className="px-4 py-2 text-xs text-neutral-500 italic">
                                        No folders yet. Create one below.
                                    </p>
                                ) : (
                                    folders.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => { setSelectedFolderId(f.id); setIsFolderMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-neutral-800/80 flex items-center gap-2 ${selectedFolderId === f.id ? "text-[#f9c111] bg-neutral-800/40 font-medium" : "text-neutral-300"}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedFolderId === f.id ? "bg-[#f9c111]" : "bg-transparent"}`} />
                                            <span className="truncate">{f.title}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
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
