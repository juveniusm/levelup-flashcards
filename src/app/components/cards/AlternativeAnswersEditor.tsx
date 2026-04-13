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
        <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-neutral-300">
                    Accepted Alternative Answers
                </label>
                <button
                    type="button"
                    onClick={() => append({ value: "" })}
                    className="text-sm flex items-center gap-1 text-[#f9c111] hover:text-[#e0ad0e] font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Alternative
                </button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                    <input
                        {...register(`acceptedAnswers.${index}.value`)}
                        placeholder="Alternative explicitly accepted answer"
                        className="w-full bg-neutral-800/50 border border-neutral-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9c111]/50 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-3 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label="Remove alternative answer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
