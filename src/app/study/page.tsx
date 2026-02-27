import Image from "next/image";
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

  const now = new Date();

  // Fetch decks and due counts in parallel
  const [decks, dueStatsCounts] = await Promise.all([
    prisma.decks.findMany({
      where: { user_id: userId || 'none' }, // Filter by user_id
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: {
        title: "asc",
      },
    }),
    userId ? prisma.sM2Stats.groupBy({
      by: ['card_id'],
      where: {
        user_id: userId,
        next_review: { lte: now }
      },
      _count: true
    }).then(async (stats) => {
      // Since we need it per deck, and SM2Stats doesn't have deck_id directly,
      // we can still use findMany with select: { card: { select: { deck_id: true } } }
      // BUT we only need the card.deck_id, not the whole object.
      // Even better: use a simpler approach if the above is still slow.
      // Let's stick to findMany but only select the deck_id to minimize data transfer.
      return prisma.sM2Stats.findMany({
        where: {
          user_id: userId,
          next_review: { lte: now }
        },
        select: {
          card: {
            select: {
              deck_id: true
            }
          }
        }
      });
    }) : Promise.resolve([])
  ]);

  // Map of deckId -> dueCount
  const dueCountMap: Record<string, number> = {};
  dueStatsCounts.forEach(stat => {
    const deckId = stat.card.deck_id;
    dueCountMap[deckId] = (dueCountMap[deckId] || 0) + 1;
  });

  const decksWithStats = decks.map((deck) => ({
    id: deck.id,
    user_id: deck.user_id,
    title: deck.title,
    deck_seq: deck.deck_seq,
    _count: deck._count,
    dueCount: dueCountMap[deck.id] || 0
  }));

  const dueDecks = decksWithStats.filter((d) => d.dueCount > 0);
  const totalDueCards = dueDecks.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <main className="max-w-6xl mx-auto space-y-12">
        <header className="flex justify-between items-center border-b border-neutral-800 pb-6 animate-in fade-in duration-300">
          <div>
            <Image
              src="/Logo3.svg"
              alt="LevelUp Student"
              width={150}
              height={48}
              className="h-12 w-auto object-contain drop-shadow-md"
              priority
            />
          </div>
          <XpWidget />
        </header>

        {/* Dynamic Welcome Message */}
        <section className="max-w-4xl mx-auto flex flex-col items-center text-center py-6 animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out fill-mode-both">
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
