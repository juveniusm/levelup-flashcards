"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder as FolderIcon, ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";

export interface FolderData {
    id: string;
    title: string;
    folder_seq: number | null;
    _count: { decks: number };
}

interface FolderItemProps {
    folder: FolderData;
    isExpanded: boolean;
    onToggle: () => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, newTitle: string) => void;
    deckCount: number;
    children: React.ReactNode;
}

export default function FolderItem({
    folder,
    isExpanded,
    onToggle,
    onDelete,
    onUpdate,
    deckCount,
    children,
}: FolderItemProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(folder.title);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleSave = async () => {
        if (!editTitle.trim() || editTitle === folder.title) {
            setIsEditing(false);
            setEditTitle(folder.title);
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/folders/${folder.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle.trim() }),
            });
            if (!res.ok) throw new Error("Failed to update folder");
            onUpdate(folder.id, editTitle.trim());
            setIsEditing(false);
            router.refresh();
        } catch {
            alert("Failed to update folder.");
            setEditTitle(folder.title);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete folder");
            onDelete(folder.id);
            router.refresh();
        } catch {
            alert("Failed to delete folder. (Decks inside will be preserved.)");
        } finally {
            setIsDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setIsEditing(false);
            setEditTitle(folder.title);
        }
    };

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 gap-2 group">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                    <ChevronDown
                        className={`w-4 h-4 text-neutral-500 flex-shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    />
                    <FolderIcon className="w-5 h-5 text-[#f9c111] flex-shrink-0" />
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            disabled={isSaving}
                            className="flex-1 bg-black border border-[#f9c111] rounded-md px-2 py-1 text-white font-semibold focus:outline-none disabled:opacity-50"
                        />
                    ) : (
                        <h3 className="font-semibold text-white truncate">{folder.title}</h3>
                    )}
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                        {deckCount} {deckCount === 1 ? "deck" : "decks"}
                    </span>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-1.5 text-green-500 hover:text-green-400 hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-50"
                                title="Save"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditTitle(folder.title);
                                }}
                                disabled={isSaving}
                                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                                title="Cancel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : showConfirmDelete ? (
                        <div className="flex bg-neutral-800 rounded-md border border-red-900/50 overflow-hidden shadow-lg animate-in slide-in-from-right-2 fade-in duration-200">
                            <button
                                type="button"
                                onClick={() => setShowConfirmDelete(false)}
                                className="px-3 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-500 font-bold transition disabled:opacity-50"
                            >
                                {isDeleting ? "..." : "Delete"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                                title="Rename folder"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirmDelete(true)}
                                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-800 rounded-md transition-colors"
                                title="Delete folder"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-neutral-800 p-4 bg-black/20">
                    {children}
                </div>
            )}
        </div>
    );
}
