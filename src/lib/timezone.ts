/**
 * Returns the given IANA timezone string if it is valid, otherwise "UTC".
 *
 * Client code sends the browser timezone with study reviews. Validating it server-side
 * (a) prevents a malformed/garbage value from throwing a RangeError deep inside the SM-2
 * and streak date math (which would 500 the request), and (b) bounds abuse of arbitrary
 * timezone strings used to shift the streak day boundary.
 */
export function normalizeTimezone(tz: unknown): string {
    if (typeof tz !== "string" || tz.length === 0) return "UTC";
    try {
        // Throws RangeError for an unknown/invalid IANA time zone.
        new Intl.DateTimeFormat("en-CA", { timeZone: tz });
        return tz;
    } catch {
        return "UTC";
    }
}
