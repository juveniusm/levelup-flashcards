import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";


/** PATCH — admin updates any user's profile */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as { role?: string }).role;
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId } = await params;
        const body = await request.json();
        const { firstName, lastName, email, username, newPassword, role: newRole } = body;

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (username !== undefined) updateData.username = username;

        if (newRole !== undefined) {
            // Prevent self-demotion
            const adminId = (session.user as { id: string }).id;
            if (userId === adminId && newRole !== "ADMIN") {
                return NextResponse.json({ error: "You cannot revoke your own admin privileges." }, { status: 400 });
            }
            updateData.role = newRole;
        }

        // Admin can set a new password without knowing the current one
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Sync the `name` field used by NextAuth
        if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
            const fn = updateData.firstName ?? user.firstName ?? "";
            const ln = updateData.lastName ?? user.lastName ?? "";
            updateData.name = `${fn} ${ln}`.trim() || undefined;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update." }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin user PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** DELETE — admin removes a user and all their data */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as { role?: string }).role;
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId } = await params;

        // Prevent self-deletion
        const adminId = (session.user as { id: string }).id;
        if (userId === adminId) {
            return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete associated data first (FK constraints)
        await prisma.sM2Stats.deleteMany({ where: { user_id: userId } });
        await prisma.reviewLog.deleteMany({ where: { user_id: userId } });
        await prisma.userStats.deleteMany({ where: { user_id: userId } });

        // Delete user's decks and their cards
        const userDecks = await prisma.decks.findMany({ where: { user_id: userId }, select: { id: true } });
        const deckIds = userDecks.map((d) => d.id);
        if (deckIds.length > 0) {
            // Delete SM2 stats for cards in those decks
            const deckCards = await prisma.cards.findMany({ where: { deck_id: { in: deckIds } }, select: { id: true } });
            const cardIds = deckCards.map((c) => c.id);
            if (cardIds.length > 0) {
                await prisma.sM2Stats.deleteMany({ where: { card_id: { in: cardIds } } });
                await prisma.reviewLog.deleteMany({ where: { card_id: { in: cardIds } } });
            }
            await prisma.cards.deleteMany({ where: { deck_id: { in: deckIds } } });
            await prisma.decks.deleteMany({ where: { id: { in: deckIds } } });
        }

        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin user DELETE error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

