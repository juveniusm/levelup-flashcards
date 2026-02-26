import prisma from "@/lib/prisma";
import StudyDeckCard from "@/app/components/study/StudyDeckCard";
import StudyDashboardList from "@/app/components/study/StudyDashboardList";
import XpWidget from "@/app/components/XpWidget";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string; email?: string } | undefined;
  const userId = user?.id;

  // Derive a friendly display name (prefer first name if name exists, else email prefix)
  let displayName = "Student";
  if (user?.name) {
    displayName = user.name.split(" ")[0];
  } else if (user?.email) {
    displayName = user.email.split("@")[0];
  }

  const decks = await prisma.decks.findMany({
    include: {
      _count: {
        select: { cards: true },
      },
      // We only need the IDs to query the due cards efficiently
      cards: {
        select: { id: true }
      }
    },
    orderBy: {
      title: "asc",
    },
  });

  const now = new Date();

  // Fetch due counts per deck efficiently
  const decksWithStats = await Promise.all(decks.map(async (deck) => {
    if (!userId || deck.cards.length === 0) {
      return {
        id: deck.id,
        user_id: deck.user_id,
        title: deck.title,
        deck_seq: deck.deck_seq,
        _count: deck._count,
        dueCount: 0
      };
    }

    const cardIds = deck.cards.map(c => c.id);

    // Count SM2 stats for this user's cards that are due
    const dueCount = await prisma.sM2Stats.count({
      where: {
        user_id: userId,
        card_id: { in: cardIds },
        next_review: { lte: now }
      }
    });

    return {
      id: deck.id,
      user_id: deck.user_id,
      title: deck.title,
      deck_seq: deck.deck_seq,
      _count: deck._count,
      dueCount
    };
  }));

  const dueDecks = decksWithStats.filter((d) => d.dueCount > 0);
  const totalDueCards = dueDecks.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
        <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo3.png"
              alt="LevelUp Student"
              className="h-12 w-auto object-contain drop-shadow-md"
            />
          </div>
          <XpWidget />
        </header>

        {/* Dynamic Welcome Message */}
        <section className="max-w-4xl mx-auto flex flex-col items-center text-center py-6 animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out">
          {totalDueCards === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
