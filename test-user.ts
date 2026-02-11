import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userId = 'demo-user-id';
        console.log(`Checking user: ${userId}`);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('User found:', user);

        const conversations = await prisma.conversation.findMany({ where: { userId } });
        console.log(`Conversations for ${userId}:`, conversations.length);
    } catch (err) {
        console.error('Diagnostic failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
