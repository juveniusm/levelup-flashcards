/**
 * One-time fix: reassign deck_seq globally so every deck has a unique number.
 * Decks are ordered by their current deck_seq then by title (alphabetical
 * tiebreaker) so the renumbering is predictable.
 * Run once from the project root: node fix_deck_seq.js
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // Fetch all decks ordered by current seq then title
    const decks = await prisma.decks.findMany({
        orderBy: [{ deck_seq: "asc" }, { title: "asc" }],
        select: { id: true, title: true, deck_seq: true },
    });

    console.log(`Found ${decks.length} deck(s). Reassigning deck_seq…\n`);

    for (let i = 0; i < decks.length; i++) {
        const newSeq = i + 1;
        const deck = decks[i];
        if (deck.deck_seq === newSeq) {
            console.log(`  [skip] "${deck.title}" already #${newSeq}`);
            continue;
        }
        await prisma.decks.update({
            where: { id: deck.id },
            data: { deck_seq: newSeq },
        });
        console.log(`  [fix]  "${deck.title}": #${deck.deck_seq} → #${newSeq}`);
    }

    console.log("\nDone. All deck_seq values are now globally unique.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
