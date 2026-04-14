import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { folderService } from "@/lib/services/folderService";

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode") || undefined;

        const folders = await folderService.fetchFolders(user.id, user.role, mode);
        return NextResponse.json(folders);
    } catch (error: unknown) {
        console.error("GET folders error:", error);
        return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title } = await request.json();

        if (!title || typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const folder = await folderService.createFolder(user.id, title.trim());
        return NextResponse.json(folder, { status: 201 });
    } catch (error: unknown) {
        console.error("POST folder error:", error);
        return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }
}
