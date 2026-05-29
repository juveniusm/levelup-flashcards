"use client";

import { UseFormRegister, UseFieldArrayReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { CardFormValues } from "./CardForm";

interface AlternativeAnswersEditorProps {
    fields: UseFieldArrayReturn<CardFormValues, "acceptedAnswers">["fields"];
    append: UseFieldArrayReturn<CardFormValues, "acceptedAnswers">["append"];
    remove: UseFieldArrayReturn<CardFormValues, "acceptedAnswers">["remove"];
    register: UseFormRegister<CardFormValues>;
}

export default function AlternativeAnswersEditor({
    fields,
    append,
    remove,
    register,
}: AlternativeAnswersEditorProps) {
    return (
        <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-foreground">
                    Accepted Alternative Answers
                </label>
                <button
                    type="button"
                    onClick={() => append({ value: "" })}
                    className="text-sm flex items-center gap-1 text-foreground hover:text-gold font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Alternative
                </button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                    <input
                        {...register(`acceptedAnswers.${index}.value`)}
                        placeholder="Alternative explicitly accepted answer"
                        className="w-full bg-secondary border border-border text-foreground p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        aria-label="Remove alternative answer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
