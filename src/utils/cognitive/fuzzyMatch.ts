/**
 * Normalizes a string for fuzzy matching by:
 * 1. Unifying case (lowercase)
 * 2. Removing all punctuation and special characters
 * 3. Compressing multiple whitespaces into a single space
 * 4. Trimming leading and trailing spaces
 */
export function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^\w\s\d]/gi, "") // remove punctuation
        .replace(/\s+/g, " ") // compress spaces
        .trim();
}

/**
 * Calculates the Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    // Increment along the first column of each row
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Compares a user's typed input to the target answer.
 * Both strings are normalized first.
 * Returns a fuzzy match score from 0.0 to 1.0 (1.0 being a perfect normalized match)
 */
export function evaluateAnswer(input: string, target: string): number {
    const normInput = normalizeString(input);
    const normTarget = normalizeString(target);

    if (normTarget.length === 0) return 0;
    if (normInput === normTarget) return 1.0;

    const distance = levenshteinDistance(normInput, normTarget);
    const maxLength = Math.max(normInput.length, normTarget.length);

    // Calculate the percentage score based on distance vs longest string length
    const score = (maxLength - distance) / maxLength;
    return Math.max(0, score);
}
