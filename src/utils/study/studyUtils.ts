export interface Card {
    id: string;
    front: string;
    back: string;
    front_image_url?: string | null;
    back_image_url?: string | null;
    ease_factor?: number;
}

export function getDifficultyLabel(ef: number): { label: string; color: string } {
    if (ef <= 1.5) return { label: "Very Hard", color: "text-red-500" };
    if (ef <= 1.8) return { label: "Hard", color: "text-orange-400" };
    if (ef <= 2.2) return { label: "Medium", color: "text-yellow-400" };
    if (ef <= 2.5) return { label: "Easy", color: "text-green-400" };
    return { label: "Mastered", color: "text-emerald-400" };
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Fisher-Yates shuffle. Returns a new shuffled array (does not mutate).
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
