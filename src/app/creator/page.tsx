import { getAuthenticatedUser } from "@/lib/auth-utils";
import { deckService } from "@/lib/services/deckService";
import DeckManager from "../components/DeckManager";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthenticatedUser();
  const userId = user?.id;
  const userRole = user?.role || "STUDENT";

  let decks: any[] = [];
  if (userId) {
    decks = await deckService.fetchDecksWithStats(userId, userRole, "creator");
  }


  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pt-12 lg:pt-0">
        <header className="flex justify-between items-end border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">LevelUp <span className="text-[#f9c111]">Creator</span></h1>
            <p className="text-neutral-400 mt-2 text-lg">Manage your decks and flashcards.</p>
          </div>
        </header>

        <DeckManager initialDecks={decks as Array<{ id: string; title: string; deck_seq: number | null; _count: { cards: number } }>} />
      </main>
    </div>
  );
}
