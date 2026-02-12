import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { ToolService } from '../services/tool.service';

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
    const messages = conversationHistory.map(m => ({
      role: m.role,
      content: String(m.content || '')
    }));

    return (streamText as any)({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
      system: `You are an Order Specialist. 
- Help check order status and manage deliveries.
- Use orderDetails first.`,
      messages,
      maxSteps: 5,
      tools: {
        orderDetails: {
          description: 'Get order details',
          parameters: z.object({ orderNumber: z.string() }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.getOrderDetails(orderNumber, userId);
          },
        },
      },
    });
  }
}
