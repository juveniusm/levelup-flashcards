import { Prisma } from "@prisma/client";

/**
 * An application error that carries the HTTP status a route should respond with.
 * Lets the service layer signal the intended status explicitly, so routes map errors
 * from a `status` field instead of substring-matching the (reword-prone) message text.
 */
export class ServiceError extends Error {
    readonly status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "ServiceError";
        this.status = status;
    }
}

/**
 * Translates the Prisma errors that carry a meaningful HTTP status into one. Returns null for
 * anything else, so callers can fall through to their generic 500 — a failure we don't recognise
 * should stay a 500 rather than be dressed up as a client error.
 *
 * Without this, `update`/`delete` against a row that doesn't exist (P2025) and unique-constraint
 * collisions (P2002) both surface as 500s, which tells the client nothing actionable.
 */
export function mapPrismaError(
    error: unknown,
    messages?: { notFound?: string; conflict?: string }
): { error: string; status: number } | null {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

    if (error.code === "P2025") {
        return { error: messages?.notFound ?? "Not found.", status: 404 };
    }

    if (error.code === "P2002") {
        if (messages?.conflict) return { error: messages.conflict, status: 409 };

        // meta.target names the offending column(s), e.g. ["email"].
        const target = JSON.stringify(error.meta?.target ?? "");
        if (target.includes("email")) return { error: "That email is already in use.", status: 409 };
        if (target.includes("username")) return { error: "That username is already taken.", status: 409 };
        return { error: "That value is already in use.", status: 409 };
    }

    return null;
}
