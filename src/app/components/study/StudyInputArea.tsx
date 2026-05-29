import { RefObject, memo } from "react";

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

const StudyInputArea = memo(function StudyInputArea({
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
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputAnswer}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Type your answer..."
                        autoComplete="off"
                        className="w-full sm:flex-1 bg-card border-2 border-border rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                    />
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onPass}
                            className="flex-1 sm:flex-none bg-secondary hover:bg-muted text-muted-foreground font-bold px-6 py-3 sm:py-0 rounded-xl transition-all border border-border hover:text-foreground"
                        >
                            Pass
                        </button>
                        <button
                            type="submit"
                            className="flex-1 sm:flex-none bg-gold hover:bg-gold/90 text-foreground font-bold px-8 py-3 sm:py-0 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={onNext}
                    autoFocus
                    className="w-full bg-secondary hover:bg-muted text-foreground font-bold py-4 rounded-xl transition-colors border-2 border-border focus:border-gold focus:outline-none"
                >
                    {continueButtonText}
                </button>
            )}
        </>
    );
});

export default StudyInputArea;
