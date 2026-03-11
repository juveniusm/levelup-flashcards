import { Card } from "@/types/card";

export type { Card };

export function getDifficultyLabel(ef: number, interval: number = 0): { label: string; color: string } {
    if (ef >= 2.5 && interval >= 21) return { label: "Mastered", color: "text-emerald-400" };
    if (ef <= 1.5) return { label: "Very Hard", color: "text-red-500" };
    if (ef <= 1.8) return { label: "Hard", color: "text-orange-400" };
    if (ef <= 2.2) return { label: "Medium", color: "text-yellow-400" };
    return { label: "Easy", color: "text-green-400" };
}

export function getCardStats(sm2_stats: any[], now: Date = new Date()) {
    const stats = sm2_stats?.[0] as { ease_factor?: number; interval?: number; next_review?: string | Date } | undefined;
    const easeFactor = stats?.ease_factor ?? 2.5;
    const interval = stats?.interval ?? 0;
    const nextReview = stats?.next_review ? new Date(stats.next_review) : null;
    const isDue = !!(nextReview && nextReview <= now);

    return { easeFactor, interval, nextReview, isDue };
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

export const DIFFICULTY_RANGES: Record<string, { min: number; max: number }> = {
    "Very Hard": { min: 0, max: 1.5 },
    "Hard": { min: 1.51, max: 1.8 },
    "Medium": { min: 1.81, max: 2.2 },
    "Easy": { min: 2.21, max: 2.5 },
    "Mastered": { min: 2.51, max: 10 },
};

export function getDifficultyFromEf(ef: number, interval: number = 0): string {
    return getDifficultyLabel(ef, interval).label;
}
