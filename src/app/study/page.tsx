import Image from "next/image";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { deckService } from "@/lib/services/deckService";
import StudyDeckCard from "@/app/components/study/StudyDeckCard";
import StudyDashboardList from "@/app/components/study/StudyDashboardList";
import XpWidget from "@/app/components/XpWidget";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthenticatedUser();
  const userId = user?.id;
  const userRole = user?.role || "STUDENT";

  // Derive a friendly display name (prefer first name if name exists, else email prefix)
  let displayName = "Student";
  if (user?.name) {
    displayName = user.name.split(" ")[0];
  } else if (user?.email) {
    displayName = user.email.split("@")[0];
  }

  let decksWithStats: any[] = [];
  let dbError = false;

  try {
    if (userId) {
      decksWithStats = await deckService.fetchDecksWithStats(userId, userRole);
    }
  } catch (error) {
    console.error("Study dashboard data fetch error:", error);
    dbError = true;
  }

  const dueDecks = decksWithStats.filter((d) => d.dueCount > 0);
  const totalDueCards = dueDecks.reduce((sum, deck) => sum + deck.dueCount, 0);


  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      <main className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        <header className="flex justify-between items-center border-b border-neutral-800 pb-6 animate-in fade-in duration-300">
          <div>
            <Image
              src="/Logo3.svg"
              alt="LevelUp Student"
              width={200}
              height={38}
              className="h-10 md:h-12 w-auto object-contain drop-shadow-md"
              priority
            />
          </div>
          <XpWidget />
        </header>

        {/* Dynamic Welcome Message */}
        <section className="max-w-4xl mx-auto flex flex-col items-center text-center py-6 animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out fill-mode-both">
          {dbError ? (
            <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-red-200">
              <h2 className="text-xl font-bold mb-2">Notice</h2>
              <p>Unable to load decks at this time.</p>
            </div>
          ) : totalDueCards === 0 ? (
            <>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                Welcome back, <span className="font-mono tracking-widest uppercase text-[#f9c111]">{displayName}</span>!
              </h1>
              <p className="text-neutral-400 text-xl font-medium max-w-2xl">
                You&apos;re currently on track! Which cards do you want to review today?
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                Ready to Level Up, <span className="font-mono tracking-widest uppercase text-[#f9c111]">{displayName}</span>?
              </h1>
              <p className="text-neutral-400 text-xl font-medium max-w-2xl">
                You have <span className="font-bold text-[#f9c111]">{totalDueCards} card{totalDueCards === 1 ? '' : 's'}</span> due for review today. Let&apos;s knock them out!
              </p>
            </>
          )}
        </section>

        <section className="max-w-4xl mx-auto space-y-12">
          {dueDecks.length > 0 && (
            <div id="due-cards" className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-neutral-800 pb-4 gap-4">
                <h2 className="text-2xl font-bold">Review Due</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dueDecks.map((deck) => (
                  <StudyDeckCard key={`due-${deck.id}`} deck={deck} variant="highlighted" />
                ))}
              </div>
            </div>
          )}

          <div id="all-decks">
            <StudyDashboardList decks={decksWithStats} />
          </div>
        </section>
      </main>
    </div>
  );
}
