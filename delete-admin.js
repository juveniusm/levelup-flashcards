const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAdmin() {
    const email = 'admin@example.com';
    console.log(`Searching for user with email: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (user) {
            console.log(`User found with ID: ${user.id}. Deleting...`);
            await prisma.user.delete({
                where: { id: user.id }
            });
            console.log('User deleted successfully.');
        } else {
            console.log('User not found.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAdmin();
