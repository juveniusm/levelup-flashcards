import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin, type AccessGrant, type AuthFailure } from "@/lib/authz";

/**
 * Verifies the current user may MANAGE a deck (owner or ADMIN; ignores is_public).
 * Returns { userId, role } on success, or { error, status } on failure.
 */
export function requireDeckAccess(deckId: string): Promise<AccessGrant | AuthFailure> {
    return requireOwnerOrAdmin(
        () => prisma.decks.findUnique({ where: { id: deckId }, select: { user_id: true } }),
        { notFound: "Deck not found" }
    );
}

/**
 * Verifies the current user may READ a deck (owner, public, or ADMIN).
 * Returns { userId, role } on success, or { error, status } on failure.
 */
export function requireDeckReadAccess(deckId: string): Promise<AccessGrant | AuthFailure> {
    return requireOwnerOrAdmin(
        () => prisma.decks.findUnique({ where: { id: deckId }, select: { user_id: true, is_public: true } }),
        { notFound: "Deck not found", allowPublic: true }
    );
}
