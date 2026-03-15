import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET — list all users (admin only) */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as { role?: string }).role;
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
