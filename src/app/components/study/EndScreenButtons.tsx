"use client";

import Link from "next/link";

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
                className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-xl transition-all shadow-[0_0_20px_rgba(249,193,17,0.3)] hover:shadow-[0_0_30px_rgba(249,193,17,0.5)] hover:-translate-y-1 text-lg"
            >
                {primaryLabel}
            </button>
            <Link
                href="/study"
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 px-12 rounded-xl transition-all hover:-translate-y-1 border border-neutral-700 text-lg"
            >
                Back to Decks
            </Link>
        </div>
    );
}
