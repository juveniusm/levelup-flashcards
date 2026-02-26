"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

// ─── Schema ──────────────────────────────────────────────────────────
export const cardSchema = z.object({
    front: z.string().min(1, "Front text is required"),
    back: z.string().min(1, "Back text is required"),
    front_image_url: z.string().optional().or(z.literal("")),
    back_image_url: z.string().optional().or(z.literal("")),
});

export type CardFormValues = z.infer<typeof cardSchema>;

// ─── Types ───────────────────────────────────────────────────────────
export interface ExistingCard {
    id: string;
    front: string;
    back: string;
    front_image_url: string | null;
    back_image_url: string | null;
}

interface CardFormProps {
    deckId: string;
    mode: "create" | "edit";
    existingCard?: ExistingCard;
}

// ─── Shared upload helper ─────────────────────────────────────────────
async function uploadImage(file: File, label: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`${label} image upload failed. Please try again.`);
    const data = await res.json();
    return data.url as string;
}

// ─── Component ───────────────────────────────────────────────────────
export default function CardForm({ deckId, mode, existingCard }: CardFormProps) {
    const router = useRouter();
    const isEdit = mode === "edit";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
    const [backImageFile, setBackImageFile] = useState<File | null>(null);
    const [isFrontDragging, setIsFrontDragging] = useState(false);
    const [isBackDragging, setIsBackDragging] = useState(false);

    // Edit-only: whether the user explicitly cleared an existing image
    const [clearFrontImage, setClearFrontImage] = useState(false);
    const [clearBackImage, setClearBackImage] = useState(false);

    // Create-only: refs to reset uncontrolled file inputs after submit
    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setFocus,
    } = useForm<CardFormValues>({
        resolver: zodResolver(cardSchema),
        defaultValues: isEdit && existingCard
            ? {
                front: existingCard.front,
                back: existingCard.back,
                front_image_url: existingCard.front_image_url || "",
                back_image_url: existingCard.back_image_url || "",
            }
            : undefined,
    });

    // ── Drag / Drop / Paste handlers ──────────────────────────────────
    const setImageFile = (side: "front" | "back", file: File | null) => {
        if (side === "front") { setFrontImageFile(file); if (file) setClearFrontImage(false); }
        else { setBackImageFile(file); if (file) setClearBackImage(false); }
    };

    const handlePaste = (e: React.ClipboardEvent, side: "front" | "back") => {
        for (const item of e.clipboardData?.items ?? []) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) setImageFile(side, file);
                break;
            }
        }
    };

    const handleDragOver = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault(); e.stopPropagation();
        if (side === "front") setIsFrontDragging(true); else setIsBackDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault(); e.stopPropagation();
        if (side === "front") setIsFrontDragging(false); else setIsBackDragging(false);
    };

    const handleDrop = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault(); e.stopPropagation();
        if (side === "front") setIsFrontDragging(false); else setIsBackDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith("image/")) setImageFile(side, file);
    };

    // ── Submit ────────────────────────────────────────────────────────
    const onSubmit = async (data: CardFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            let frontUrl = isEdit ? (clearFrontImage ? null : data.front_image_url) : data.front_image_url;
            let backUrl = isEdit ? (clearBackImage ? null : data.back_image_url) : data.back_image_url;

            if (frontImageFile) frontUrl = await uploadImage(frontImageFile, "Front");
            if (backImageFile) backUrl = await uploadImage(backImageFile, "Back");

            const payload = { ...data, front_image_url: frontUrl, back_image_url: backUrl };

            const url = isEdit
                ? `/api/decks/${deckId}/cards/${existingCard!.id}`
                : `/api/decks/${deckId}/cards`;

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(isEdit ? "Failed to update card" : "Failed to add card");

            if (isEdit) {
                router.push(`/creator/${deckId}`);
                router.refresh();
            } else {
                reset();
                setFrontImageFile(null);
                setBackImageFile(null);
                if (frontInputRef.current) frontInputRef.current.value = "";
                if (backInputRef.current) backInputRef.current.value = "";
                router.refresh();
                setTimeout(() => setFocus("front"), 50);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────
    const showFrontExisting = isEdit && !clearFrontImage && !frontImageFile && existingCard?.front_image_url;
    const showBackExisting = isEdit && !clearBackImage && !backImageFile && existingCard?.back_image_url;

    // ── Card side sub-component (reused for front + back) ─────────────
    const CardSide = ({
        side,
        isDragging,
        showExisting,
        existingUrl,
        onClear,
        inputRef,
    }: {
        side: "front" | "back";
        isDragging: boolean;
        showExisting?: string | null | boolean;
        existingUrl?: string | null;
        onClear?: () => void;
        inputRef?: React.RefObject<HTMLInputElement>;
    }) => {
        const isFront = side === "front";
        const label = isFront ? "Front (Prompt)" : "Back (Target Answer)";
        const imgLabel = isFront ? "Image (Prompt)" : "Image (Target Answer)";
        const placeholder = isFront
            ? "e.g. What is the powerhouse of the cell? (Paste or drop images here)"
            : "e.g. Mitochondria (Paste or drop images here)";
        const imageFile = isFront ? frontImageFile : backImageFile;
        const fieldError = isFront ? errors.front : errors.back;

        return (
            <div
                className={`transition-colors ${isFront ? "pb-4 border-b border-neutral-800" : "pt-2"} ${isDragging ? "bg-neutral-800/50 rounded-lg p-3" : ""}`}
                onDragOver={(e) => handleDragOver(e, side)}
                onDragLeave={(e) => handleDragLeave(e, side)}
                onDrop={(e) => handleDrop(e, side)}
            >
                <label className="block text-sm font-semibold text-neutral-300 mb-2">{label}</label>
                <textarea
                    {...register(side)}
                    rows={3}
                    onPaste={(e) => handlePaste(e, side)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all resize-none text-base"
                    placeholder={placeholder}
                />
                {fieldError && <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>}

                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-400 mb-2">{imgLabel} — Optional</label>

                    {showExisting && existingUrl && (
                        <div className="relative mb-3 inline-block group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={existingUrl} alt={`Current ${side}`} className="h-24 object-cover rounded shadow-md border border-neutral-700" />
                            <button
                                type="button"
                                onClick={onClear}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >×</button>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <input
                            id={`${mode}_${side}_image`}
                            type="file"
                            accept="image/*"
                            ref={inputRef}
                            onChange={(e) => setImageFile(side, e.target.files?.[0] || null)}
                            disabled={isSubmitting}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#f9c111] file:text-black hover:file:bg-[#e0ad0e] disabled:opacity-50 text-sm"
                        />
                        {imageFile && (
                            <span className="text-xs text-[#f9c111] font-semibold truncate max-w-[150px]">{imageFile.name}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2">
                {isEdit ? "Edit Flashcard" : "Add New Card"}
            </h3>

            <form
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={(e) => {
                    if (!isEdit && e.ctrlKey && e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit(onSubmit)();
                    }
                }}
                className="space-y-6"
            >
                <CardSide
                    side="front"
                    isDragging={isFrontDragging}
                    showExisting={showFrontExisting}
                    existingUrl={existingCard?.front_image_url}
                    onClear={() => setClearFrontImage(true)}
                    inputRef={frontInputRef as React.RefObject<HTMLInputElement>}
                />
                <CardSide
                    side="back"
                    isDragging={isBackDragging}
                    showExisting={showBackExisting}
                    existingUrl={existingCard?.back_image_url}
                    onClear={() => setClearBackImage(true)}
                    inputRef={backInputRef as React.RefObject<HTMLInputElement>}
                />

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <div className={`flex gap-4 ${isEdit ? "pt-4" : ""}`}>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => router.push(`/creator/${deckId}`)}
                            disabled={isSubmitting}
                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`${isEdit ? "flex-1 bg-[#f9c111] hover:bg-[#e0ad0e] text-black" : "w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"} font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50`}
                    >
                        {isSubmitting
                            ? (isEdit ? "Saving..." : "Adding...")
                            : (isEdit ? "Save Changes" : "+ Add Card")}
                    </button>
                </div>
            </form>
        </div>
    );
}
