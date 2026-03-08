const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tokens = await prisma.verificationToken.findMany();
    console.log("== ALL TOKENS ==");
    console.dir(tokens, { depth: null });

    const logs = await prisma.user.findMany({
        where: { email: { contains: 'gaming' } }
    });
    console.log("== GAMING USERS ==");
    console.dir(logs, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
