import { LRUCache } from "lru-cache";

type Options = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export function rateLimit(options?: Options) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    return {
        check: (limit: number, token: string) => {
            const currentUsage = (tokenCache.get(token) as number) || 0;
            tokenCache.set(token, currentUsage + 1);

            return currentUsage >= limit; // true if rate limited
        },
    };
}
