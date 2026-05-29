import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/auth-utils";

export type Role = "ADMIN" | "STUDENT";

/** Standard failure shape returned by the authorization guards. */
export type AuthFailure = { error: string; status: number };

/** Successful access grant: the resolved user id and role. */
export type AccessGrant = { userId: string; role: Role };

/**
 * Requires an authenticated user with the ADMIN role.
 * Returns the user on success, or { error, status } (401 / 403) on failure.
 * Callers discriminate with `if ("error" in result)`.
 */
export async function requireAdmin(): Promise<AuthenticatedUser | AuthFailure> {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Unauthorized", status: 401 };
    if (user.role !== "ADMIN") return { error: "Forbidden", status: 403 };
    return user;
}

/**
 * Generic owner-or-ADMIN resource gate. `loadOwner` fetches the resource's
 * owner id (and optionally its `is_public` flag), or null when it does not exist.
 *
 *   not authenticated                    → 401 Unauthorized
 *   resource missing                     → 404 (opts.notFound, default "Not found")
 *   not owner / not public / not ADMIN   → 403 Forbidden
 *
 * Pass { allowPublic: true } for read gates that also permit public resources.
 * Callers discriminate with `if ("error" in result)`.
 */
export async function requireOwnerOrAdmin(
    loadOwner: () => Promise<{ user_id: string; is_public?: boolean } | null>,
    opts: { notFound?: string; allowPublic?: boolean } = {}
): Promise<AccessGrant | AuthFailure> {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Unauthorized", status: 401 };

    const resource = await loadOwner();
    if (!resource) return { error: opts.notFound ?? "Not found", status: 404 };

    const isOwner = resource.user_id === user.id;
    const isPublic = opts.allowPublic === true && resource.is_public === true;
    if (!isOwner && !isPublic && user.role !== "ADMIN") {
        return { error: "Forbidden", status: 403 };
    }

    return { userId: user.id, role: user.role };
}
