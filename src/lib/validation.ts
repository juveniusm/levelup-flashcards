import { z } from "zod";

/**
 * Coerce a query-string value to a bounded integer, falling back to `fallback` on any
 * malformed / out-of-range input. This closes the `?param=abc` → `take: NaN` → Prisma 500
 * class of bug while staying backward-compatible: values above `max` are clamped (not
 * rejected), matching the prior `Math.min(..., max)` behavior, and a missing param uses
 * `fallback`.
 */
export function clampInt(
    value: string | null,
    opts: { fallback: number; min: number; max?: number }
): number {
    const parsed = z.coerce.number().int().min(opts.min).safeParse(value ?? undefined);
    if (!parsed.success) return opts.fallback;
    return opts.max !== undefined ? Math.min(parsed.data, opts.max) : parsed.data;
}
