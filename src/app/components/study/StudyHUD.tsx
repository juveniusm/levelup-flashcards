"use client";
import { formatTime } from "@/utils/study/studyUtils";
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

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
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div className="flex flex-col w-full mb-3 sm:mb-8 border-b border-border pb-2 sm:pb-4">
            {isOffline && (
                <div className="flex items-center justify-center gap-2 w-full bg-destructive/15 text-destructive text-xs sm:text-sm py-1 px-4 mb-3 rounded-full mx-auto">
                    <WifiOff size={14} />
                    <span className="font-bold tracking-widest">OFFLINE MODE (SAVING LOCALLY)</span>
                </div>
            )}
            <div className="flex flex-row justify-between items-center w-full">
                {mode === "classic" ? (
                    lives > 1000 ? (
                        <div className="text-sm sm:text-lg font-bold font-mono tracking-widest text-muted-foreground">
                            NO LIVES
                        </div>
                    ) : (
                        <div className="flex gap-1 sm:gap-2 text-xl sm:text-2xl">
                            {Array.from({ length: Math.max(5, lives) }).map((_, i) => (
                                <span key={i} className={i < lives ? "text-destructive" : "text-muted"}>
                                    &hearts;
                                </span>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="text-sm sm:text-lg font-bold font-mono tracking-widest text-muted-foreground">
                            <span className="text-foreground">{formatTime(elapsedSeconds)}</span>
                        </div>
                        <div className="text-sm sm:text-lg font-bold font-mono tracking-widest text-muted-foreground">
                            CARDS <span className="text-foreground">{totalCardsSeen}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="text-sm sm:text-xl font-bold font-mono tracking-widest text-muted-foreground">
                        SCORE <span className="text-foreground">{score.toString().padStart(4, "0")}</span>
                    </div>
                    <button
                        onClick={onEnd}
                        className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest border border-border hover:border-destructive/50 px-2 sm:px-4 py-1 sm:py-2 rounded-lg"
                    >
                        End
                    </button>
                </div>
            </div>
        </div>
    );
}
