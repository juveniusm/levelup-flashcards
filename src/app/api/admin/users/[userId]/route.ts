import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";


/** PATCH — admin updates any user's profile */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const admin = await requireAdmin();
        if ("error" in admin) {
            return NextResponse.json({ error: admin.error }, { status: admin.status });
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
            emailVerified?: Date | null;
        } = {};

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof email !== "string" || !emailRegex.test(email)) {
                return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
            }
            updateData.email = email;
            if (email !== user.email) {
                // Pointing the account at a new address invalidates any prior verification;
                // the new address has not been proven to belong to the user.
                updateData.emailVerified = null;
            }
        }
        if (username !== undefined) updateData.username = username;

        if (newRole !== undefined) {
            const validRoles = ["ADMIN", "STUDENT"];
            if (!validRoles.includes(newRole)) {
                return NextResponse.json({ error: "Invalid role. Must be ADMIN or STUDENT." }, { status: 400 });
            }

            // Only Super Admin can change roles
            const userEmail = admin.email;
            const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
            if (!SUPER_ADMIN_EMAIL) {
                return NextResponse.json({ error: "Super admin not configured." }, { status: 500 });
            }

            if (userEmail !== SUPER_ADMIN_EMAIL) {
                return NextResponse.json({ error: "Only the Super Admin can manage user roles." }, { status: 403 });
            }

            // Prevent self-demotion
            const adminId = admin.id;
            if (userId === adminId && newRole !== "ADMIN") {
                return NextResponse.json({ error: "You cannot revoke your own admin privileges." }, { status: 400 });
            }
            updateData.role = newRole;
        }

        // Admin can set a new password without knowing the current one
        if (newPassword !== undefined) {
            if (typeof newPassword !== "string" || newPassword.length < 8) {
                return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
            }
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
        const admin = await requireAdmin();
        if ("error" in admin) {
            return NextResponse.json({ error: admin.error }, { status: admin.status });
        }

        const { userId } = await params;

        // Prevent self-deletion
        const adminId = admin.id;
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

