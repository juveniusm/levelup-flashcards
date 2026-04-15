import Dexie, { type EntityTable } from "dexie";
import { type Card } from "@/utils/study/studyUtils";

export interface OfflineDeck {
    deckId: string;
    title: string;
    cards: Card[];
    lastDownloadedAt: number;
}

export interface QueuedReview {
    id?: number; // Auto-incrementing Dexie PK
    deckId: string;
    cardId: string;
    qualityGrade: number;
    isReviewMode: boolean;
    timestamp: number; // For Last-Write-Wins logic
}

// Lazy-initialize Dexie only on the client side.
// During SSR, `indexedDB` doesn't exist and `new Dexie()` would crash.
let _db: (Dexie & {
    offlineDecks: EntityTable<OfflineDeck, "deckId">;
    reviewOutbox: EntityTable<QueuedReview, "id">;
}) | null = null;

function getDb() {
    if (_db) return _db;

    _db = new Dexie("LevelUpOfflineDatabase") as Dexie & {
        offlineDecks: EntityTable<OfflineDeck, "deckId">;
        reviewOutbox: EntityTable<QueuedReview, "id">;
    };

    _db.version(1).stores({
        offlineDecks: "deckId",
        reviewOutbox: "++id, timestamp, deckId, cardId"
    });

    return _db;
}

// Export a proxy that lazily initializes on first access (client-only)
export const db = typeof window !== "undefined" ? getDb() : (null as any);
