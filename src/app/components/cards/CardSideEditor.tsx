import Image from "next/image";
import { UseFormRegister, FieldError } from "react-hook-form";
import { CardFormValues } from "./CardForm";

interface CardSideEditorProps {
    side: "front" | "back";
    mode: "create" | "edit";
    isDragging: boolean;
    showExisting?: string | null | boolean;
    existingUrl?: string | null;
    imageFile: File | null;
    fieldError?: FieldError;
    register: UseFormRegister<CardFormValues>;
    isSubmitting: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
    onClear?: () => void;
    onDragOver: (e: React.DragEvent, side: "front" | "back") => void;
    onDragLeave: (e: React.DragEvent, side: "front" | "back") => void;
    onDrop: (e: React.DragEvent, side: "front" | "back") => void;
    onPaste: (e: React.ClipboardEvent, side: "front" | "back") => void;
    onImageChange: (side: "front" | "back", file: File | null) => void;
}

export default function CardSideEditor({
    side,
    mode,
    isDragging,
    showExisting,
    existingUrl,
    imageFile,
    fieldError,
    register,
    isSubmitting,
    inputRef,
    onClear,
    onDragOver,
    onDragLeave,
    onDrop,
    onPaste,
    onImageChange,
}: CardSideEditorProps) {
    const isFront = side === "front";
    const label = isFront ? "Front (Prompt)" : "Back (Target Answer)";
    const imgLabel = isFront ? "Image (Prompt)" : "Image (Target Answer)";
    const placeholder = isFront
        ? "e.g. What is the powerhouse of the cell? (Paste or drop images here)"
        : "e.g. Mitochondria (Paste or drop images here)";

    return (
        <div
            className={`transition-colors ${isFront ? "pb-4 border-b border-border" : "pt-2"} ${isDragging ? "bg-muted rounded-lg p-3" : ""}`}
            onDragOver={(e) => onDragOver(e, side)}
            onDragLeave={(e) => onDragLeave(e, side)}
            onDrop={(e) => onDrop(e, side)}
        >
            <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
            <textarea
                {...register(side)}
                rows={3}
                onPaste={(e) => onPaste(e, side)}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none text-base"
                placeholder={placeholder}
            />
            {fieldError && <p className="text-destructive text-xs mt-1">{fieldError.message}</p>}

            <div className="mt-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">{imgLabel} — Optional</label>

                {showExisting && existingUrl && (
                    <div className="relative mb-3 inline-block group h-24 w-40 overflow-hidden rounded shadow-sm border border-border">
                        <Image
                            src={existingUrl}
                            alt={`Current ${side}`}
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={onClear}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >×</button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <input
                        id={`${mode}_${side}_image`}
                        type="file"
                        accept="image/*"
                        ref={inputRef}
                        onChange={(e) => onImageChange(side, e.target.files?.[0] || null)}
                        disabled={isSubmitting}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-foreground hover:file:bg-gold/90 disabled:opacity-50 text-sm"
                    />
                    {imageFile && (
                        <span className="text-xs text-foreground font-semibold truncate max-w-[150px]">{imageFile.name}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
