import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const userRole = (session.user as { role?: string }).role;
        const body = await request.json();
        const { firstName, lastName, email, username, currentPassword, newPassword } = body;

        // Build update payload
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};

        // Everyone can update first/last name
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;

        // Only admins can update email and username
        if (email !== undefined || username !== undefined) {
            if (userRole !== "ADMIN") {
                return NextResponse.json(
                    { error: "Only admins can change email or username." },
                    { status: 403 }
                );
            }
            if (email !== undefined) updateData.email = email;
            if (username !== undefined) updateData.username = username;
        }

        // Password change: require current password verification
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: "Current password is required to set a new password." },
                    { status: 400 }
                );
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });

            if (!user?.password) {
                return NextResponse.json(
                    { error: "Cannot change password for OAuth accounts." },
                    { status: 400 }
                );
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Sync the `name` field used by NextAuth
        if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
            const existing = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
            });
            const fn = updateData.firstName ?? existing?.firstName ?? "";
            const ln = updateData.lastName ?? existing?.lastName ?? "";
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
        console.error("Profile PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
