import { useState, useCallback, useEffect } from "react";
import { db } from "@/lib/indexedDB";
import type { Card } from "@/utils/study/studyUtils";

export function useSyncEngine() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Forces caching of a URL into the native Service Worker Cache Storage API
    const forceCacheMedia = async (url: string) => {
        try {
            const cache = await caches.open("level-up-media");
            const response = await fetch(url, { mode: 'no-cors' });
            if (response) {
                await cache.put(url, response);
            }
        } catch (err) {
            console.error("Failed to cache media", url, err);
            throw err;
        }
    };

    const downloadDeck = useCallback(async (deckId: string) => {
        setIsDownloading(true);
        try {
            const res = await fetch(`/api/decks/${deckId}/studyData`);
            if (!res.ok) throw new Error("Failed to fetch deck from server");
            const data = await res.json();
            const deck = data.deck;

            // Optional: Cache all images associated with this deck to avoid Quota Exceeded and guarantee offline mode
            const urlsToCache = new Set<string>();
            deck.cards.forEach((card: Card) => {
                if (card.front_image_url) urlsToCache.add(card.front_image_url);
                if (card.back_image_url) urlsToCache.add(card.back_image_url);
            });

            for (const url of urlsToCache) {
                await forceCacheMedia(url);
            }

            // Save to Dexie
            await db.offlineDecks.put({
                deckId: deck.id,
                title: deck.title,
                cards: deck.cards,
                lastDownloadedAt: Date.now()
            });

            return true;
        } catch (err: any) {
            console.error("Download error:", err);
            if (err.name === 'QuotaExceededError') {
                alert("Storage full! Please free up some space on your device to download this deck.");
            }
            return false;
        } finally {
            setIsDownloading(false);
        }
    }, []);

    const syncOutbox = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;
        setIsSyncing(true);

        try {
            const queued = await db.reviewOutbox.orderBy('timestamp').toArray();
            if (queued.length === 0) {
                setIsSyncing(false);
                return;
            }

            const res = await fetch('/api/decks/sync', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviews: queued,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
            });

            if (res.ok) {
                // Bulk delete the synced keys
                const keys = queued.map(q => q.id).filter((id): id is number => id !== undefined);
                await db.reviewOutbox.bulkDelete(keys);
            } else if (res.status === 401) {
                console.warn("Auth expired during sync outbox.");
                // Graceful lockout logic handle at UI layer
            }
        } catch (err) {
            console.error("Failed to sync outbox", err);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    // Setup an automatic debounce listener for when connection returns
    useEffect(() => {
        const handleOnline = () => {
            // Give cellular radios 5 seconds to stabilize before unleashing the massive POST request
            setTimeout(() => {
                if (navigator.onLine) {
                    syncOutbox();
                }
            }, 5000);
        };

        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, [syncOutbox]);

    return { downloadDeck, syncOutbox, isDownloading, isSyncing };
}
