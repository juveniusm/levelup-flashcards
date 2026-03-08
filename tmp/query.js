const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'gaminginsurgence@gmail.com';
    const users = await prisma.user.findMany({ where: { email } });
    console.log("== USERS ==");
    console.dir(users, { depth: null });

    const tokens = await prisma.verificationToken.findMany({ where: { identifier: email } });
    console.log("== TOKENS ==");
    console.dir(tokens, { depth: null });

    if (users.length > 0) {
        const accounts = await prisma.account.findMany({ where: { userId: users[0].id } });
        console.log("== ACCOUNTS ==");
        console.dir(accounts, { depth: null });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
