"use client";

interface EndScreenButtonsProps {
    primaryLabel: string;
    onPrimaryClick: () => void;
}

export default function EndScreenButtons({
    primaryLabel,
    onPrimaryClick,
}: EndScreenButtonsProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
                onClick={onPrimaryClick}
                className="bg-gold hover:bg-gold/90 text-foreground font-bold py-4 px-12 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-1 text-lg"
            >
                {primaryLabel}
            </button>
            <a
                href="/study"
                className="bg-secondary hover:bg-muted text-foreground font-bold py-4 px-12 rounded-full transition-all hover:-translate-y-1 border border-border text-lg"
            >
                Back to Decks
            </a>
        </div>
    );
}
