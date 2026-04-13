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

        const updateData: {
            firstName?: string;
            lastName?: string;
            email?: string;
            username?: string;
            role?: string;
            password?: string;
            name?: string;
        } = {};

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (username !== undefined) updateData.username = username;

        if (newRole !== undefined) {
            const validRoles = ["ADMIN", "STUDENT"];
            if (!validRoles.includes(newRole)) {
                return NextResponse.json({ error: "Invalid role. Must be ADMIN or STUDENT." }, { status: 400 });
            }

            // Only Super Admin can change roles
            const userEmail = session.user.email;
            const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "juveniusm@gmail.com";

            if (userEmail !== SUPER_ADMIN_EMAIL) {
                return NextResponse.json({ error: "Only the Super Admin can manage user roles." }, { status: 403 });
            }

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

        // If the user being deleted is an admin, preserve their decks by 
        // reassigning them to the admin performing the deletion
        if (user.role === "ADMIN") {
            await prisma.decks.updateMany({
                where: { user_id: userId },
                data: { user_id: adminId }
            });
        }

        // Deleting the user will cascade delete their cards, stats, and logs
        // as long as the Prisma schema is configured correctly.
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin user DELETE error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

