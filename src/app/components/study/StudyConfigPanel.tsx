import { useState, useMemo, useEffect } from "react";
import { X, Play, Settings2, CheckSquare, Square } from "lucide-react";
import { DIFFICULTY_RANGES } from "@/utils/study/studyUtils";

interface StudyConfigPanelProps {
    totalCards: number;
    difficultyCounts?: Record<string, number>;
    onStart: (config: { limit: number; difficulties: string[]; noLives: boolean }) => void;
    onCancel: () => void;
}

export default function StudyConfigPanel({ totalCards, difficultyCounts, onStart, onCancel }: StudyConfigPanelProps) {
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(Object.keys(DIFFICULTY_RANGES));
    
    // Calculate total available cards based on selected difficulties
    const maxAvailable = useMemo(() => {
        if (!difficultyCounts) return totalCards;
        return selectedDifficulties.reduce((sum, label) => sum + (difficultyCounts[label] || 0), 0);
    }, [selectedDifficulties, difficultyCounts, totalCards]);

    const [limit, setLimit] = useState(Math.min(20, maxAvailable || totalCards));
    const [noLives, setNoLives] = useState(false);

    // Ensure limit doesn't exceed maxAvailable when difficulties change
    useEffect(() => {
        if (limit > maxAvailable) {
            setLimit(maxAvailable);
        } else if (limit === 0 && maxAvailable > 0) {
            setLimit(Math.min(20, maxAvailable));
        }
    }, [maxAvailable, limit]);

    const toggleDifficulty = (label: string) => {
        setSelectedDifficulties(prev =>
            prev.includes(label)
                ? prev.filter(l => l !== label)
                : [...prev, label]
        );
    };

    const selectAll = () => setSelectedDifficulties(Object.keys(DIFFICULTY_RANGES));
    const selectNone = () => setSelectedDifficulties([]);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-gold" />
                    Custom Session
                </h4>
                <button onClick={onCancel} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* Card Count */}
                <div className={maxAvailable === 0 ? "opacity-40 pointer-events-none" : ""}>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Card Limit</label>
                        <span className="text-sm font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                            {limit} / {maxAvailable}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={maxAvailable > 0 ? "1" : "0"}
                        max={maxAvailable}
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
                        <span>{maxAvailable > 0 ? 1 : 0}</span>
                        <span>{maxAvailable}</span>
                    </div>
                </div>

                {/* Difficulty Filters */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Include Difficulty</label>
                        <div className="flex gap-3">
                            <button
                                onClick={selectAll}
                                className="text-[10px] font-bold text-foreground hover:text-gold uppercase tracking-tighter transition-colors"
                            >
                                All
                            </button>
                            <button
                                onClick={selectNone}
                                className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-tighter transition-colors"
                            >
                                None
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(DIFFICULTY_RANGES).map(label => {
                            const isSelected = selectedDifficulties.includes(label);
                            const count = difficultyCounts?.[label] ?? 0;
                            const isDisabled = count === 0 && !!difficultyCounts;

                            return (
                                <button
                                    key={label}
                                    disabled={isDisabled}
                                    onClick={() => toggleDifficulty(label)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border relative ${isSelected
                                        ? "bg-gold-soft border-gold text-foreground"
                                        : "bg-secondary border-border text-muted-foreground hover:border-gold/40"
                                    } ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                                >
                                    {label}
                                    {count > 0 && (
                                        <span className={`text-[9px] font-bold px-1 rounded ${isSelected ? "bg-gold/30" : "bg-muted text-muted-foreground"}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {maxAvailable === 0 && (
                        <p className="text-[10px] text-destructive mt-2 italic">Select at least one difficulty category with cards.</p>
                    )}
                </div>

                {/* Lives Toggle */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Lives</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setNoLives(false)}
                            className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                                !noLives
                                    ? "bg-gold-soft border-gold text-foreground"
                                    : "bg-secondary border-border text-muted-foreground hover:border-gold/40"
                            }`}
                        >
                            5 Lives
                        </button>
                        <button
                            type="button"
                            onClick={() => setNoLives(true)}
                            className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                                noLives
                                    ? "bg-gold-soft border-gold text-foreground"
                                    : "bg-secondary border-border text-muted-foreground hover:border-gold/40"
                            }`}
                        >
                            No Lives
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={() => onStart({ limit, difficulties: selectedDifficulties, noLives })}
                disabled={selectedDifficulties.length === 0 || limit === 0}
                className="mt-6 w-full bg-gold hover:bg-gold/90 text-foreground font-black py-3 rounded-full transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-xs"
            >
                <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" />
                Start Session
            </button>
        </div>
    );
}
