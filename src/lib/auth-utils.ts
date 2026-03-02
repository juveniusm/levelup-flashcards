import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return null;
    }

    const user = session.user as any;

    if (!user.id || !user.email) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "STUDENT",
    };
}
