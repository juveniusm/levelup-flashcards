import { memo } from "react";

const SessionMetrics = memo(function SessionMetrics({
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
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Score</span>
                <span className="text-4xl font-black font-mono tracking-widest text-foreground">
                    {(score ?? 0).toString().padStart(4, "0")}
                </span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Right</span>
                <span className="text-4xl font-black font-mono tracking-widest text-green-600">
                    {(correctAnswers ?? 0).toString().padStart(2, "0")}
                </span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Wrong</span>
                <span className="text-4xl font-black font-mono tracking-widest text-destructive">
                    {(incorrectAnswers ?? 0).toString().padStart(2, "0")}
                </span>
            </div>
            {totalCardsSeen !== undefined && (
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Cards Seen</span>
                    <span className="text-4xl font-black font-mono tracking-widest text-foreground">
                        {totalCardsSeen.toString().padStart(2, "0")}
                    </span>
                </div>
            )}
            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">XP Earned</span>
                <span className="text-4xl font-black font-mono tracking-widest text-gold">
                    +{xpEarned}
                </span>
            </div>
        </div>
    );
});

export default SessionMetrics;
