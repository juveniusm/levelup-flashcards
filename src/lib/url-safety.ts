/**
 * Whether a stored image URL is safe to persist/render.
 *
 * Accepts same-origin relative paths (e.g. the dev "/uploads/.." disk uploads) and
 * absolute http(s) URLs (e.g. Cloudinary). Rejects dangerous schemes such as
 * "javascript:", "data:", "vbscript:" and protocol-relative "//host" URLs, which have
 * no legitimate use for a card image and could be abused in a URL sink.
 */
export function isSafeImageUrl(url: unknown): boolean {
    if (typeof url !== "string" || url.length === 0) return false;
    // Same-origin relative path (but not protocol-relative "//host").
    if (url.startsWith("/") && !url.startsWith("//")) return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}
