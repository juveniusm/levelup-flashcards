import prisma from "@/lib/prisma";

export interface FolderWithCount {
    id: string;
    user_id: string;
    title: string;
    folder_seq: number | null;
    _count: { decks: number };
}

export const folderService = {
    /**
     * Fetches all folders for a user, including deck counts.
     * Admins see all ADMIN-authored folders; students see only their own.
     */
    async fetchFolders(userId: string, role: string, mode?: string): Promise<FolderWithCount[]> {
        const whereClause = mode === "creator" && role === "ADMIN"
            ? { user: { role: "ADMIN" } }
            : { user_id: userId };

        const folders = await prisma.folder.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { decks: true },
                },
            },
            orderBy: { title: "asc" },
        });

        return folders.map((f) => ({
            id: f.id,
            user_id: f.user_id,
            title: f.title,
            folder_seq: f.folder_seq,
            _count: f._count,
        }));
    },

    /**
     * Creates a new folder with an incremented sequence (global counter).
     */
    async createFolder(userId: string, title: string) {
        // Same shape as deckService.createDeck: folder_seq is a display value, so the counter
        // stays global and the read+insert share a transaction. See that method for why this
        // narrows the race rather than eliminating it.
        return await prisma.$transaction(async (tx) => {
            const lastFolder = await tx.folder.findFirst({
                orderBy: { folder_seq: "desc" },
                select: { folder_seq: true },
            });

            return await tx.folder.create({
                data: {
                    title,
                    user_id: userId,
                    folder_seq: (lastFolder?.folder_seq || 0) + 1,
                },
            });
        });
    },

    /**
     * Renames a folder. Assumes caller has verified ownership.
     */
    async renameFolder(folderId: string, title: string) {
        return await prisma.folder.update({
            where: { id: folderId },
            data: { title },
        });
    },

    /**
     * Deletes a folder. Decks inside are preserved (folder_id set to null by cascade).
     */
    async deleteFolder(folderId: string) {
        return await prisma.folder.delete({
            where: { id: folderId },
        });
    },

    /**
     * Looks up who owns a folder: `{ user_id }`, or null if no folder has this id.
     * Performs NO authorization of its own — callers pass the result to
     * `requireOwnerOrAdmin`, which is where the ownership/admin decision is made.
     */
    async getFolderOwner(folderId: string): Promise<{ user_id: string } | null> {
        return await prisma.folder.findUnique({
            where: { id: folderId },
            select: { user_id: true },
        });
    },
};
