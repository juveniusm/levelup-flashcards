"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderPlus } from "lucide-react";

const folderSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(50, "Title is too long"),
});

type FolderFormValues = z.infer<typeof folderSchema>;

export interface NewFolder {
    id: string;
    title: string;
    folder_seq: number | null;
    _count: { decks: number };
}

export default function CreateFolderForm({ onFolderCreated }: { onFolderCreated?: (folder: NewFolder) => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FolderFormValues>({
        resolver: zodResolver(folderSchema),
    });

    const onSubmit = async (data: FolderFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: data.title }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error ?? "Failed to create folder");
            }

            const newFolder = await response.json();
            reset();
            onFolderCreated?.({ ...newFolder, _count: { decks: 0 } });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-md mt-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#f9c111]" /> New Folder
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="folder-title" className="block text-sm font-medium text-neutral-400 mb-1">
                        Folder Name
                    </label>
                    <input
                        {...register("title")}
                        id="folder-title"
                        type="text"
                        placeholder="e.g. Semester 1"
                        className={`w-full bg-neutral-950 border ${errors.title ? "border-red-500" : "border-neutral-800"} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all`}
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Creating..." : "Create Folder"}
                </button>
            </form>
        </div>
    );
}
