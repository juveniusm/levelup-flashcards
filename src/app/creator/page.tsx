import { getAuthenticatedUser } from "@/lib/auth-utils";
import { deckService, DeckWithStats } from "@/lib/services/deckService";
import { folderService, FolderWithCount } from "@/lib/services/folderService";
import DeckManager from "../components/DeckManager";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthenticatedUser();
  const userId = user?.id;
  const userRole = user?.role || "STUDENT";

  let decks: DeckWithStats[] = [];
  let folders: FolderWithCount[] = [];
  if (userId) {
    [decks, folders] = await Promise.all([
      deckService.fetchDecksWithStats(userId, userRole, "creator"),
      folderService.fetchFolders(userId, userRole, "creator"),
    ]);
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

        <DeckManager
          initialDecks={decks.map(d => ({
            id: d.id,
            title: d.title,
            deck_seq: d.deck_seq,
            folder_id: d.folder_id,
            _count: d._count,
          }))}
          initialFolders={folders}
        />
      </main>
    </div>
  );
}
