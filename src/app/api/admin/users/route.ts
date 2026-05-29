import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET — list all users (admin only) */
export async function GET(request: Request) {
    try {
        const admin = await requireAdmin();
        if ("error" in admin) {
            return NextResponse.json({ error: admin.error }, { status: admin.status });
        }

        const { searchParams } = new URL(request.url);
        const skip = parseInt(searchParams.get("skip") || "0", 10);
        const take = parseInt(searchParams.get("take") || "50", 10);

        const users = await prisma.user.findMany({
            skip,
            take: Math.min(take, 100), // Max 100 at a time
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
            },
            orderBy: { email: "asc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Admin users GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
