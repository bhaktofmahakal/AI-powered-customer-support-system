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
      system: `You are an Order Tracking Specialist.

CRITICAL INSTRUCTIONS:
1. If the user mentions an order number (like ORD-1002, ORDER-123, etc.), immediately use the orderDetails tool to fetch the information.
2. If you find an order number in the message, DO NOT ask for it again - just use the tool.
3. After calling the tool, explain the results in a friendly way.
4. If no order number is mentioned, politely ask for it.

Examples:
User: "Where is my order ORD-1002?"
You: [Call orderDetails with ORD-1002, then explain the status]

User: "Track my order"
You: "I'd be happy to help track your order. Could you please provide your order number? It usually looks like ORD-XXXX."`,
      messages,
      maxSteps: 5,
      tools: {
        orderDetails: {
          description: 'Get detailed information about an order including status, shipping, and delivery estimates. Use this whenever an order number is mentioned.',
          parameters: z.object({
            orderNumber: z.string().describe('The order number, e.g., ORD-1002')
          }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.getOrderDetails(orderNumber, userId);
          },
        },
        deliveryStatus: {
          description: 'Check current delivery status and tracking information',
          parameters: z.object({
            orderNumber: z.string().describe('The order number to track')
          }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.checkDeliveryStatus(orderNumber, userId);
          },
        },
      },
    });
  }
}
