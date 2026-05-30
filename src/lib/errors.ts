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
