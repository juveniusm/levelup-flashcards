const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Setting user role to ADMIN...");

    try {
        const user = await prisma.user.update({
            where: { email: 'juveniusm@gmail.com' },
            data: { role: 'ADMIN' },
        });
        console.log(`Updated user ${user.email} to role: ${user.role}`);
    } catch (e) {
        console.error("Could not update user. Do they exist yet?", e.message);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
