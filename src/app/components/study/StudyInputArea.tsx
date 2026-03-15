import { RefObject } from "react";

interface StudyInputAreaProps {
    isImageEnlarged: boolean;
    stateValue: string; // "question" | "feedback_correct" | "feedback_incorrect" | string
    inputRef: RefObject<HTMLInputElement | null>;
    inputAnswer: string;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onPass: () => void;
    onNext: () => void;
    continueButtonText?: string;
}

export default function StudyInputArea({
    isImageEnlarged,
    stateValue,
    inputRef,
    inputAnswer,
    onInputChange,
    onSubmit,
    onPass,
    onNext,
    continueButtonText = "Continue (Press Enter)",
}: StudyInputAreaProps) {
    if (isImageEnlarged) return null;

    return (
        <>
            {stateValue === "question" ? (
                <form onSubmit={onSubmit} className="flex gap-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputAnswer}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Type your answer..."
                        autoComplete="off"
                        className="flex-1 bg-neutral-900 border-2 border-neutral-800 rounded-xl px-6 py-4 text-xl text-white focus:outline-none focus:border-[#f9c111] transition-colors shadow-inner"
                    />
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onPass}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-bold px-6 rounded-xl transition-all border border-neutral-700 hover:text-white"
                        >
                            Pass
                        </button>
                        <button
                            type="submit"
                            className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold px-8 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(249,193,17,0.39)] hover:shadow-[0_6px_20px_rgba(249,193,17,0.23)] hover:-translate-y-0.5"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={onNext}
                    autoFocus
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 rounded-xl transition-colors border-2 border-neutral-700 focus:border-[#f9c111] focus:outline-none"
                >
                    {continueButtonText}
                </button>
            )}
        </>
    );
}
