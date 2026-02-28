const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Radical Database Reset ---');
    try {
        // Delete in correct order to respect foreign key constraints
        const stats = await prisma.sM2Stats.deleteMany({});
        console.log(`- Deleted ${stats.count} SM2Stats`);

        const reviews = await prisma.reviewLog.deleteMany({});
        console.log(`- Deleted ${reviews.count} ReviewLogs`);

        const cards = await prisma.cards.deleteMany({});
        console.log(`- Deleted ${cards.count} Cards`);

        const decks = await prisma.decks.deleteMany({});
        console.log(`- Deleted ${decks.count} Decks`);

        const userStats = await prisma.userStats.deleteMany({});
        console.log(`- Deleted ${userStats.count} UserStats`);

        const sessions = await prisma.session.deleteMany({});
        console.log(`- Deleted ${sessions.count} Sessions`);

        const accounts = await prisma.account.deleteMany({});
        console.log(`- Deleted ${accounts.count} Accounts`);

        const users = await prisma.user.deleteMany({});
        console.log(`- Deleted ${users.count} Users`);

        console.log('\nDatabase is now completely empty.');
    } catch (error) {
        console.error('Error during database reset:', error);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
