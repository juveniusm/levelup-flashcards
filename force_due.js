/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("ALL USERS:", users.map(u => u.email));

    const user = users.find(u => u.email === "admin@example.com") || users[0];
    if (!user) {
        console.error("No users in DB");
        return;
    }

    console.log("TARGET USER:", user.email);

    const decks = await prisma.decks.findMany({ include: { cards: true } });
    if (decks.length === 0) {
        console.log("No decks found.");
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 5);

    for (const deck of decks) {
        if (deck.cards.length === 0) {
            console.log(`Skipping empty deck: ${deck.title}`);
            continue;
        }

        console.log(`Setting up to 2 cards in "${deck.title}" to early due date...`);

        for (const card of deck.cards.slice(0, 2)) {
            const existing = await prisma.sM2Stats.findUnique({
                where: { card_id_user_id: { card_id: card.id, user_id: user.id } }
            });

            if (existing) {
                await prisma.sM2Stats.update({
                    where: { card_id_user_id: { card_id: card.id, user_id: user.id } },
                    data: { next_review: yesterday }
                });
                console.log("Updated", card.front);
            } else {
                await prisma.sM2Stats.create({
                    data: {
                        card_id: card.id,
                        user_id: user.id,
                        next_review: yesterday,
                        interval: 1,
                        repetitions: 1,
                        ease_factor: 2.5
                    }
                });
                console.log("Created", card.front);
            }
        }
    }

    console.log("Finished forcing due dates.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
