import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { calculateXpForReview } from "@/utils/xp/xpUtils";
import { normalizeTimezone } from "@/lib/timezone";

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
            // Never return sensitive columns (password hash, emailVerified, image, etc.) to the
            // client. The route serializes this object verbatim in its response.
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
            },
        });
    },

    /**
     * Centralized logic for awarding XP and updating streaks.
     */
    async updateUserStats(userId: string, qualityGrade: number, userTz: string, awardXp: boolean = true) {
        // awardXp lets callers suppress the XP grant (e.g. when this card already earned XP
        // today) while still updating the streak. Streak credit is for studying at all today.
        const xpEarned = awardXp ? calculateXpForReview(qualityGrade) : 0;

        // Get user's last review for streak logic
        const lastReview = await prisma.reviewLog.findFirst({
            where: { user_id: userId },
            orderBy: { reviewed_at: 'desc' },
        });

        const tz = normalizeTimezone(userTz);
        const now = new Date();
        const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
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
    },

    /**
     * Returns true if the user already has a ReviewLog for this card on the same local
     * calendar day as referenceDate. Used to award XP at most once per card per day so
     * repeated submissions for the same card cannot farm XP. Must be called BEFORE the
     * current review's log is written so the current review is not counted.
     */
    async hasReviewedCardOnDay(userId: string, cardId: string, referenceDate: Date, userTz: string): Promise<boolean> {
        const tz = normalizeTimezone(userTz);
        const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const dayStr = fmt.format(referenceDate);
        // A ±48h window around the reference instant comfortably covers the local day for any
        // timezone offset; we then compare exact local-day strings (DST-safe via Intl).
        const windowStart = new Date(referenceDate.getTime() - 48 * 60 * 60 * 1000);
        const windowEnd = new Date(referenceDate.getTime() + 48 * 60 * 60 * 1000);
        const logs = await prisma.reviewLog.findMany({
            where: {
                user_id: userId,
                card_id: cardId,
                reviewed_at: { gte: windowStart, lte: windowEnd },
            },
            select: { reviewed_at: true },
        });
        return logs.some((l) => fmt.format(l.reviewed_at) === dayStr);
    }
};
