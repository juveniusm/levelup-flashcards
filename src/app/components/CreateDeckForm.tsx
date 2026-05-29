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
        <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">Create New Deck</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
                        Deck Title
                    </label>
                    <input
                        {...register("title")}
                        id="title"
                        type="text"
                        placeholder="e.g. Neuroscience 101"
                        className={`w-full bg-background border ${errors.title ? "border-destructive" : "border-border"
                            } rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all`}
                    />
                    {errors.title && (
                        <p className="text-destructive text-xs mt-1">{errors.title.message}</p>
                    )}
                </div>

                {/* Folder selector */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Folder <span className="text-muted-foreground/70">(optional)</span>
                    </label>
                    <div className="relative" ref={folderMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsFolderMenuOpen((v) => !v)}
                            className={`w-full bg-background border ${isFolderMenuOpen ? "border-gold" : "border-border"} hover:border-gold/40 rounded-lg px-4 py-2 text-foreground text-left focus:outline-none transition-all cursor-pointer text-sm flex justify-between items-center`}
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <FolderIcon className={`w-4 h-4 flex-shrink-0 ${selectedFolder ? "text-gold" : "text-muted-foreground"}`} />
                                <span className={`truncate ${selectedFolder ? "text-foreground" : "text-muted-foreground"}`}>
                                    {selectedFolder ? selectedFolder.title : "No folder (Uncategorized)"}
                                </span>
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${isFolderMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isFolderMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1 z-30 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedFolderId(null); setIsFolderMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted flex items-center gap-2 ${selectedFolderId === null ? "text-foreground bg-gold-soft/50 font-medium" : "text-muted-foreground"}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedFolderId === null ? "bg-gold" : "bg-transparent"}`} />
                                    No folder (Uncategorized)
                                </button>
                                {folders.length === 0 ? (
                                    <p className="px-4 py-2 text-xs text-muted-foreground italic">
                                        No folders yet. Create one below.
                                    </p>
                                ) : (
                                    folders.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => { setSelectedFolderId(f.id); setIsFolderMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted flex items-center gap-2 ${selectedFolderId === f.id ? "text-foreground bg-gold-soft/50 font-medium" : "text-muted-foreground"}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedFolderId === f.id ? "bg-gold" : "bg-transparent"}`} />
                                            <span className="truncate">{f.title}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold hover:bg-gold/90 text-foreground font-semibold py-2 px-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Creating..." : "Create Deck"}
                </button>
            </form>
        </div>
    );
}
