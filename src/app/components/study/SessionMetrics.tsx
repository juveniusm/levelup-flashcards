export default function SessionMetrics({
    score,
    correctAnswers,
    incorrectAnswers,
    xpEarned,
    totalCardsSeen,
}: {
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    xpEarned: number;
    totalCardsSeen?: number; // Optional, used in Endless mode
}) {
    return (
        <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Score</span>
                <span className="text-4xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {(score ?? 0).toString().padStart(4, "0")}
                </span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Right</span>
                <span className="text-4xl font-black font-mono tracking-widest text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                    {(correctAnswers ?? 0).toString().padStart(2, "0")}
                </span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Wrong</span>
                <span className="text-4xl font-black font-mono tracking-widest text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    {(incorrectAnswers ?? 0).toString().padStart(2, "0")}
                </span>
            </div>
            {totalCardsSeen !== undefined && (
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Cards Seen</span>
                    <span className="text-4xl font-black font-mono tracking-widest text-[#f9c111] drop-shadow-[0_0_15px_rgba(249,193,17,0.4)]">
                        {totalCardsSeen.toString().padStart(2, "0")}
                    </span>
                </div>
            )}
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">XP Earned</span>
                <span className="text-4xl font-black font-mono tracking-widest text-[#f9c111] drop-shadow-[0_0_15px_rgba(249,193,17,0.4)]">
                    +{xpEarned}
                </span>
            </div>
        </div>
    );
}
