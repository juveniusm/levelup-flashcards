import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * TEMPORARY one-off endpoint to restore an admin role.
 * Secured by NEXTAUTH_SECRET comparison. Remove after use.
 */
export async function POST(req: NextRequest) {
    try {
        const { email, secret } = await req.json();

        if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { email },
            data: { role: "ADMIN" },
            select: { id: true, email: true, role: true },
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("fix-role error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
