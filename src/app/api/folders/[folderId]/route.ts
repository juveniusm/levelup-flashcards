import { NextResponse } from "next/server";
import { requireOwnerOrAdmin } from "@/lib/authz";
import { folderService } from "@/lib/services/folderService";
import { mapPrismaError } from "@/lib/errors";

/**
 * Verifies that the current user owns the folder (or is an ADMIN).
 */
function requireFolderAccess(folderId: string) {
    return requireOwnerOrAdmin(
        () => folderService.getFolderOwner(folderId),
        { notFound: "Folder not found" }
    );
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
    } catch (error: unknown) {
        console.error("PUT folder error:", error);
        const mapped = mapPrismaError(error, { notFound: "Folder not found" });
        if (mapped) {
            return NextResponse.json({ error: mapped.error }, { status: mapped.status });
        }
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
    } catch (error: unknown) {
        console.error("DELETE folder error:", error);
        const mapped = mapPrismaError(error, { notFound: "Folder not found" });
        if (mapped) {
            return NextResponse.json({ error: mapped.error }, { status: mapped.status });
        }
        return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
    }
}
