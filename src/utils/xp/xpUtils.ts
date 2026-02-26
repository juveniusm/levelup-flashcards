/**
 * XP & Leveling utilities
 * Every 100 XP = 1 level. Simple and predictable.
 */

/** XP awarded per card review based on SM-2 quality grade */
export function calculateXpForReview(qualityGrade: number): number {
    if (qualityGrade === 5) return 15; // Perfect recall
    if (qualityGrade >= 4) return 10;  // Correct
    return 0;                          // Incorrect — no XP
}

/**
 * Derive level info from total XP.
 *
 * Scaling curve: level L→L+1 costs 100×L XP.
 *   Level 1→2 = 100 XP, 2→3 = 200 XP, 3→4 = 300 XP, etc.
 *
 * Cumulative XP to reach level L = 50 × (L-1) × L
 */
export function getLevelFromXp(totalXp: number): {
    level: number;
    currentXp: number;
    xpForNextLevel: number;
} {
    // Solve 50*(L-1)*L <= totalXp using quadratic formula
    const level = Math.floor((1 + Math.sqrt(1 + (totalXp / 12.5))) / 2);
    const cumulativeXpForLevel = 50 * (level - 1) * level;
    const currentXp = totalXp - cumulativeXpForLevel;
    const xpForNextLevel = 100 * level;
    return { level, currentXp, xpForNextLevel };
}

const TITLES: [number, string][] = [
    [50, "Grandmaster"],
    [40, "Master"],
    [30, "Expert"],
    [20, "Scholar"],
    [10, "Apprentice"],
    [5, "Learner"],
    [1, "Novice"],
];

/** Get a rank title for a given level */
export function getLevelTitle(level: number): string {
    for (const [threshold, title] of TITLES) {
        if (level >= threshold) return title;
    }
    return "Novice";
}
