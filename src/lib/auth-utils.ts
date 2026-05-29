import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface AuthenticatedUser {
    id: string;
    email: string;
    name?: string;
    role: "ADMIN" | "STUDENT";
}

/**
 * Retrieves the currently authenticated user from the session.
 * Returns null if the user is not authenticated.
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return null;
    }

    const { user } = session;

    if (!user.id || !user.email) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || "STUDENT",
    };
});

/**
 * Derives a friendly display name for a user.
 * Prefers first name if name exists, else email prefix.
 */
export function getDisplayName(user?: { name?: string | null; email?: string | null }): string {
    if (user?.name) {
        return user.name.split(" ")[0];
    } else if (user?.email) {
        return user.email.split("@")[0];
    }
    return "Student";
}
