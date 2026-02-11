import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing DB connection...');
        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables in DB:', tables);

        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

        const conversationCount = await prisma.conversation.count();
        console.log('Conversation count:', conversationCount);
    } catch (err) {
        console.error('DB Connection Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
