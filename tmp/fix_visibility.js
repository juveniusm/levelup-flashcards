const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.decks.updateMany({
            where: {
                user: {
                    role: 'ADMIN'
                }
            },
            data: {
                is_public: true
            }
        });
        console.log(`Successfully updated ${result.count} Admin decks to public.`);
    } catch (error) {
        console.error('Error updating decks:', error);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
