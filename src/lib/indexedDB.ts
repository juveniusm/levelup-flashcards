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

const db = new Dexie("LevelUpOfflineDatabase") as Dexie & {
    offlineDecks: EntityTable<OfflineDeck, "deckId">;
    reviewOutbox: EntityTable<QueuedReview, "id">;
};

// Declare tables, specifying primary keys and indexed props
// Note: We don't need to specify every property, just the ones we want to query by.
db.version(1).stores({
    offlineDecks: "deckId", 
    reviewOutbox: "++id, timestamp, deckId, cardId"
});

export { db };
