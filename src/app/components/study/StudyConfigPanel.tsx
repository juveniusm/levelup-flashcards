"use client";

import { useState } from "react";
import { X, Play, Settings2, Check } from "lucide-react";
import { DIFFICULTY_RANGES } from "@/utils/study/studyUtils";

interface StudyConfigPanelProps {
    totalCards: number;
    onStart: (config: { limit: number; difficulties: string[] }) => void;
    onCancel: () => void;
}

export default function StudyConfigPanel({ totalCards, onStart, onCancel }: StudyConfigPanelProps) {
    const [limit, setLimit] = useState(Math.min(20, totalCards));
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(Object.keys(DIFFICULTY_RANGES));

    const toggleDifficulty = (label: string) => {
        setSelectedDifficulties(prev =>
            prev.includes(label)
                ? prev.filter(l => l !== label)
                : [...prev, label]
        );
    };

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[#f9c111] flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Custom Session
                </h4>
                <button onClick={onCancel} className="p-1 hover:bg-neutral-800 rounded-md transition-colors text-neutral-500 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* Card Count */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Card Limit</label>
                        <span className="text-sm font-mono text-white bg-neutral-800 px-2 py-0.5 rounded">{limit}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max={totalCards}
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#f9c111]"
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-neutral-600 font-mono">
                        <span>1</span>
                        <span>{totalCards}</span>
                    </div>
                </div>

                {/* Difficulty Filters */}
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-3">Include Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(DIFFICULTY_RANGES).map(label => {
                            const isSelected = selectedDifficulties.includes(label);
                            return (
                                <button
                                    key={label}
                                    onClick={() => toggleDifficulty(label)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected
                                        ? "bg-[#f9c111]/10 border-[#f9c111] text-[#f9c111]"
                                        : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-500"
                                        }`}
                                >
                                    {isSelected && <Check className="w-3 h-3" />}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onStart({ limit, difficulties: selectedDifficulties })}
                disabled={selectedDifficulties.length === 0}
                className="mt-6 w-full bg-[#f9c111] hover:bg-yellow-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(249,193,17,0.2)] hover:shadow-[0_4px_20px_rgba(249,193,17,0.4)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-xs"
            >
                <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" />
                Start Session
            </button>
        </div>
    );
}
