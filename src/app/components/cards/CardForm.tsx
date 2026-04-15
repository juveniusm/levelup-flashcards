"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/types/card";
import { useCardImageDrop } from "@/hooks/useCardImageDrop";
import CardSideEditor from "./CardSideEditor";
import AlternativeAnswersEditor from "./AlternativeAnswersEditor";

// ─── Schema ──────────────────────────────────────────────────────────
export const cardSchema = z.object({
    front: z.string().min(1, "Front text is required"),
    back: z.string().min(1, "Back text is required"),
    front_image_url: z.string().optional().or(z.literal("")),
    back_image_url: z.string().optional().or(z.literal("")),
    acceptedAnswers: z.array(z.object({ value: z.string() })).optional(),
});

export type CardFormValues = z.infer<typeof cardSchema>;

// ─── Types ───────────────────────────────────────────────────────────

interface CardFormProps {
    deckId: string;
    mode: "create" | "edit";
    existingCard?: Card;
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const {
        frontImageFile, backImageFile,
        isFrontDragging, isBackDragging,
        clearFrontImage, clearBackImage,
        frontInputRef, backInputRef,
        setImageFile, setClearFrontImage, setClearBackImage,
        handlePaste, handleDragOver, handleDragLeave, handleDrop,
        resetImages,
    } = useCardImageDrop();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setFocus,
        control,
    } = useForm<CardFormValues>({
        resolver: zodResolver(cardSchema),
        defaultValues: isEdit && existingCard
            ? {
                front: existingCard.front,
                back: existingCard.back,
                front_image_url: existingCard.front_image_url || "",
                back_image_url: existingCard.back_image_url || "",
                acceptedAnswers: existingCard.acceptedAnswers ? existingCard.acceptedAnswers.map((ans) => ({ value: ans })) : [],
            }
            : undefined,
    });

    // ── Submit ────────────────────────────────────────────────────────
    const onSubmit = async (data: CardFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            let frontUrl = isEdit ? (clearFrontImage ? null : data.front_image_url) : data.front_image_url;
            let backUrl = isEdit ? (clearBackImage ? null : data.back_image_url) : data.back_image_url;

            if (frontImageFile) frontUrl = await uploadImage(frontImageFile, "Front");
            if (backImageFile) backUrl = await uploadImage(backImageFile, "Back");

            const payload = { 
                ...data, 
                front_image_url: frontUrl, 
                back_image_url: backUrl,
                acceptedAnswers: data.acceptedAnswers ? data.acceptedAnswers.map((a) => a.value) : []
            };

            const url = isEdit
                ? `/api/decks/${deckId}/cards/${existingCard!.id}`
                : `/api/decks/${deckId}/cards`;

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? (isEdit ? "Failed to update card" : "Failed to add card"));
            }

            if (isEdit) {
                router.push(`/creator/${deckId}`);
                router.refresh();
            } else {
                reset();
                resetImages();
                router.refresh();
                setTimeout(() => setFocus("front"), 50);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const { fields: acceptedAnswersFields, append, remove } = useFieldArray({
        control,
        name: "acceptedAnswers",
    });

    // ── Delete (edit mode only) ───────────────────────────────────────
    const handleDelete = async () => {
        if (!existingCard) return;
        setIsDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/decks/${deckId}/cards/${existingCard.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? "Failed to delete card");
            }
            router.push(`/creator/${deckId}`);
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to delete card.");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────
    const showFrontExisting = isEdit && !clearFrontImage && !frontImageFile && existingCard?.front_image_url;
    const showBackExisting = isEdit && !clearBackImage && !backImageFile && existingCard?.back_image_url;



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
                <CardSideEditor
                    side="front"
                    mode={mode}
                    isDragging={isFrontDragging}
                    showExisting={showFrontExisting}
                    existingUrl={existingCard?.front_image_url}
                    imageFile={frontImageFile}
                    fieldError={errors.front}
                    register={register}
                    isSubmitting={isSubmitting}
                    inputRef={frontInputRef as React.RefObject<HTMLInputElement>}
                    onClear={() => setClearFrontImage(true)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    onImageChange={setImageFile}
                />
                <CardSideEditor
                    side="back"
                    mode={mode}
                    isDragging={isBackDragging}
                    showExisting={showBackExisting}
                    existingUrl={existingCard?.back_image_url}
                    imageFile={backImageFile}
                    fieldError={errors.back}
                    register={register}
                    isSubmitting={isSubmitting}
                    inputRef={backInputRef as React.RefObject<HTMLInputElement>}
                    onClear={() => setClearBackImage(true)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    onImageChange={setImageFile}
                />

                <AlternativeAnswersEditor
                    fields={acceptedAnswersFields}
                    append={append}
                    remove={remove}
                    register={register}
                />

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <div className={`flex gap-4 ${isEdit ? "pt-4" : ""}`}>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => router.push(`/creator/${deckId}`)}
                            disabled={isSubmitting || isDeleting}
                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || isDeleting}
                        className={`${isEdit ? "flex-1 bg-[#f9c111] hover:bg-[#e0ad0e] text-black" : "w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"} font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50`}
                    >
                        {isSubmitting
                            ? (isEdit ? "Saving..." : "Adding...")
                            : (isEdit ? "Save Changes" : "+ Add Card")}
                    </button>
                </div>

                {isEdit && (
                    <div className="pt-4 mt-2 border-t border-neutral-800">
                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isSubmitting || isDeleting}
                                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-500 font-medium transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete this card
                            </button>
                        ) : (
                            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-200">Delete this card permanently?</p>
                                    <p className="text-xs text-red-300/70 mt-0.5">This cannot be undone. The card and its review history will be removed.</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 font-bold flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {isDeleting ? "Deleting..." : "Delete Card"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
