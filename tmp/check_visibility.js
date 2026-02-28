const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const decks = await prisma.decks.findMany({
        include: {
            user: {
                select: { email: true, role: true }
            },
            _count: {
                select: { cards: true }
            }
        }
    });

    console.log('--- Decks in DB ---');
    console.log(JSON.stringify(decks, null, 2));

    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true }
    });
    console.log('--- Users in DB ---');
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
