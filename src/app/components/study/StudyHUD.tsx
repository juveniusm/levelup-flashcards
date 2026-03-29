import { formatTime } from "@/utils/study/studyUtils";

interface StudyHUDProps {
    mode: "classic" | "endless";
    score: number;
    onEnd: () => void;
    
    // Classic specific
    lives?: number;
    
    // Endless specific
    elapsedSeconds?: number;
    totalCardsSeen?: number;
}

export default function StudyHUD({
    mode,
    score,
    onEnd,
    lives = 0,
    elapsedSeconds = 0,
    totalCardsSeen = 0,
}: StudyHUDProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8 border-b border-neutral-800 pb-4">
            {mode === "classic" ? (
                <div className="flex gap-2 text-2xl">
                    {Array.from({ length: Math.max(5, lives) }).map((_, i) => (
                        <span key={i} className={i < lives ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-neutral-800"}>
                            &hearts;
                        </span>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                        <span className="text-white">{formatTime(elapsedSeconds)}</span>
                    </div>
                    <div className="text-lg font-bold font-mono tracking-widest text-neutral-400">
                        CARDS <span className="text-[#f9c111]">{totalCardsSeen}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-xl font-bold font-mono tracking-widest text-white">
                    SCORE <span className="text-[#f9c111]">{score.toString().padStart(4, "0")}</span>
                </div>
                <button
                    onClick={onEnd}
                    className="text-sm font-bold text-neutral-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-neutral-700 hover:border-red-400/50 px-4 py-2 rounded-lg"
                >
                    End
                </button>
            </div>
        </div>
    );
}
