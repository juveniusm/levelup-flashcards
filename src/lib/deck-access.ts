import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type AccessError = { error: string; status: number };
type AccessSuccess = { userId: string; role: string };

/**
 * Verifies that the current session user has permission to manage a deck.
 * Returns { userId, role } on success, or { error, status } on failure.
 * Owners and ADMINs are allowed; everyone else is Forbidden.
 */
export async function requireDeckAccess(deckId: string): Promise<AccessError | AccessSuccess> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized", status: 401 };

    const userId = (session.user as { id: string }).id;
    const role = (session.user as { role?: string }).role ?? "STUDENT";

    const deck = await prisma.decks.findUnique({
        where: { id: deckId },
        select: { user_id: true },
    });

    if (!deck) return { error: "Deck not found", status: 404 };

    if (deck.user_id !== userId && role !== "ADMIN") {
        return { error: "Forbidden", status: 403 };
    }

    return { userId, role };
}
