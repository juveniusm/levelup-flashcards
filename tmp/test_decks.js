const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const totalDecks = await prisma.decks.count();
    const publicDecks = await prisma.decks.count({ where: { is_public: true } });
    const privateDecks = await prisma.decks.count({ where: { is_public: false } });

    console.log('--- Database Stats ---');
    console.log('Total Decks:', totalDecks);
    console.log('Public Decks:', publicDecks);
    console.log('Private Decks:', privateDecks);

    if (totalDecks > 0) {
        const sampleDecks = await prisma.decks.findMany({ take: 5 });
        console.log('Sample Decks:', JSON.stringify(sampleDecks, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
