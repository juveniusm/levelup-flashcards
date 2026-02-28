import prisma from "@/lib/prisma";
import DeckManager from "../components/DeckManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  // Admins see all admin decks. Students see only their own.
  let whereClause: any = { user_id: userId || 'none' };
  if (userRole === "ADMIN") {
    whereClause = {
      user: {
        role: "ADMIN"
      }
    };
  }

  const decks = await prisma.decks.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { cards: true },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
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
