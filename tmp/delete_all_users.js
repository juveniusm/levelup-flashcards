const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Deleting all users and related data...");

    // Delete all verification tokens
    const deletedTokens = await prisma.verificationToken.deleteMany({});
    console.log(`Deleted ${deletedTokens.count} verification tokens.`);

    // Delete all users (Cascade deletes Decks, Cards, Accounts, Sessions, Stats, ReviewLogs)
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`Deleted ${deletedUsers.count} users.`);

    console.log("Database cleared of all users.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
