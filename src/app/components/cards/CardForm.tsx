"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
