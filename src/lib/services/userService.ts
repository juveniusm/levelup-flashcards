import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { calculateXpForReview } from "@/utils/xp/xpUtils";

export interface UserProfileUpdateData {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
}

export const userService = {
    /**
     * Fetches user profile data.
     */
    async getUserProfile(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
            },
        });
    },

    /**
     * Updates user profile data, including password and name syncing.
     */
    async updateUserProfile(userId: string, userRole: string, data: UserProfileUpdateData) {
        const { firstName, lastName, email, username, currentPassword, newPassword } = data;
        const updateData: Prisma.UserUpdateInput = {};

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;

        if (email !== undefined || username !== undefined) {
            if (userRole !== "ADMIN") {
                throw new Error("Only admins can change email or username.");
            }
            if (email !== undefined) updateData.email = email;
            if (username !== undefined) updateData.username = username;
        }

        if (newPassword) {
            if (!currentPassword) {
                throw new Error("Current password is required to set a new password.");
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });

            if (!user?.password) {
                throw new Error("Cannot change password for OAuth accounts.");
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                throw new Error("Current password is incorrect.");
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Sync name field for NextAuth
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
            throw new Error("No fields to update.");
        }

        return await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    },

    /**
     * Centralized logic for awarding XP and updating streaks.
     */
    async updateUserStats(userId: string, qualityGrade: number, userTz: string) {
        const xpEarned = calculateXpForReview(qualityGrade);

        // Get user's last review for streak logic
        const lastReview = await prisma.reviewLog.findFirst({
            where: { user_id: userId },
            orderBy: { reviewed_at: 'desc' },
        });

        const now = new Date();
        const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: userTz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const todayStr = dateFormatter.format(now);

        let streakIncrement = 0;
        let setStreakTo = undefined;

        if (!lastReview) {
            setStreakTo = 1;
        } else {
            const lastDateStr = dateFormatter.format(lastReview.reviewed_at);

            if (todayStr !== lastDateStr) {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = dateFormatter.format(yesterday);

                if (lastDateStr === yesterdayStr) {
                    streakIncrement = 1;
                } else {
                    setStreakTo = 1;
                }
            }
        }

        const userStats = await prisma.userStats.upsert({
            where: { user_id: userId },
            update: {
                total_xp: { increment: xpEarned },
                ...(setStreakTo !== undefined ? { current_streak: setStreakTo } : {}),
                ...(streakIncrement > 0 ? { current_streak: { increment: streakIncrement } } : {}),
            },
            create: {
                user_id: userId,
                total_xp: xpEarned,
                current_streak: 1
            },
        });

        return {
            xpEarned,
            totalXp: userStats.total_xp,
            currentStreak: userStats.current_streak
        };
    }
};
