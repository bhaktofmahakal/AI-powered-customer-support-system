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

CRITICAL RULES:
1. When you see an order number (ORD-XXXX), use the orderDetails tool immediately.
2. AFTER calling a tool, you MUST explain the results in plain text to the user.
3. NEVER end your response after just calling a tool - always add a text explanation.
4. If the tool returns data, summarize it in a friendly way.
5. If the tool returns an error, explain it politely and suggest next steps.

Example Flow:
User: "Where is my order ORD-1002?"
Step 1: [Call orderDetails tool with ORD-1002]
Step 2: [Tool returns: {status: "shipped", tracking: "TRK123"}]
Step 3: YOU MUST SAY: "Great news! Your order ORD-1002 has been shipped. The tracking number is TRK123. You can expect delivery within 3-5 business days."

If no order number is found:
"I'd be happy to help track your order. Could you please provide your order number? It usually looks like ORD-XXXX."`,
      messages,
      maxSteps: 5,
      tools: {
        orderDetails: {
          description: 'Get detailed order information. Always explain the results after calling this.',
          parameters: z.object({
            orderNumber: z.string().describe('The order number, e.g., ORD-1002')
          }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            return await ToolService.getOrderDetails(orderNumber, userId);
          },
        },
        deliveryStatus: {
          description: 'Check delivery status. Always explain the tracking info after calling this.',
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
