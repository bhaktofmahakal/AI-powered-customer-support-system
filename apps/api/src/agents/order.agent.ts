import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { ToolService } from '../services/tool.service';
import { ConversationService } from '../services/conversation.service';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export class OrderAgent {
  static async handleQuery(
    userMessage: string,
    conversationHistory: any[],
    userId: string,
    conversationId?: string
  ) {
    const systemPrompt = `You are an order management specialist.`;

    return streamText({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
      system: systemPrompt,
      messages: conversationHistory,
      maxSteps: 5,
      tools: {
        orderDetails: {
          description: 'Get order details',
          parameters: z.object({ orderNumber: z.string() }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.getOrderDetails(orderNumber, userId);
          },
        },
        deliveryStatus: {
          description: 'Check delivery',
          parameters: z.object({ orderNumber: z.string() }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.checkDeliveryStatus(orderNumber, userId);
          },
        },
        cancelOrder: {
          description: 'Cancel order',
          parameters: z.object({ orderNumber: z.string() }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.cancelOrder(orderNumber, userId);
          },
        },
        queryHistory: {
          description: 'Query history',
          parameters: z.object({ limit: z.number().optional().default(10) }),
          execute: async ({ limit }: { limit: number }) => {
            if (!conversationId) return { found: false, messages: [] };

            const isOwner = await ConversationService.userOwnsConversation(conversationId, userId);
            if (!isOwner) return { found: false, messages: [], error: 'Unauthorized' };

            const history = await ToolService.queryConversationHistory(conversationId, userId, limit);
            return { found: true, messages: history };
          },
        },
      },
    });
  }
}
