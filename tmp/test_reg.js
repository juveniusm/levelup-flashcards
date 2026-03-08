const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting test registration...");
    const email = 'test_reg_error@gmail.com';
    const password = 'Password123!';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating user...");
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: "Test User",
                role: "STUDENT",
            },
        });
        console.log("User created:", newUser.id);

        const token = crypto.randomBytes(32).toString("hex");

        console.log("Creating token...");
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });
        console.log("Token created.");

    } catch (error) {
        console.error("Caught error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
