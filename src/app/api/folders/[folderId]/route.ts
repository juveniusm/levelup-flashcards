import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { folderService } from "@/lib/services/folderService";

/**
 * Verifies that the current user owns the folder (or is an ADMIN).
 */
async function requireFolderAccess(folderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Unauthorized", status: 401 as const };

    const folder = await folderService.getFolderOwner(folderId);
    if (!folder) return { error: "Folder not found", status: 404 as const };

    if (folder.user_id !== user.id && user.role !== "ADMIN") {
        return { error: "Forbidden", status: 403 as const };
    }

    return { userId: user.id, role: user.role };
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ folderId: string }> }
) {
    const { folderId } = await params;
    const auth = await requireFolderAccess(folderId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { title } = await request.json();

        if (!title || typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const updated = await folderService.renameFolder(folderId, title.trim());
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ folderId: string }> }
) {
    const { folderId } = await params;
    const auth = await requireFolderAccess(folderId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        await folderService.deleteFolder(folderId);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
    }
}
