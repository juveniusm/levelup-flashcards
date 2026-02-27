/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { password, role: 'ADMIN', name: 'Admin User' },
        create: {
            email: 'admin@example.com',
            password,
            role: 'ADMIN',
            name: 'Admin User'
        }
    });

    console.log('Seeded Admin:', admin.email);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
