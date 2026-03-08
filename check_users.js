require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: {
                email: {
                    contains: 'juven',
                    mode: 'insensitive'
                }
            },
            include: {
                accounts: true
            }
        })
        console.log(JSON.stringify(users, null, 2))
    } catch (err) {
        console.error(err)
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect()
    })
