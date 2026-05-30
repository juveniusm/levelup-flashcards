import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { clampInt } from "@/lib/validation";
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
        const skip = clampInt(searchParams.get("skip"), { fallback: 0, min: 0 });
        const take = clampInt(searchParams.get("take"), { fallback: 50, min: 0, max: 100 }); // Max 100 at a time

        const users = await prisma.user.findMany({
            skip,
            take,
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
