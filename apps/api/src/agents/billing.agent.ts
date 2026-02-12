import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { ToolService } from '../services/tool.service';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export class BillingAgent {
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
      system: `You are a helpful Billing Specialist.

CRITICAL RULES:
1. When a user asks about refunds, you MUST respond with text asking for their Transaction ID.
2. NEVER return empty or null responses.
3. If you use a tool, ALWAYS explain what you found in plain text.
4. Be conversational and helpful.

Example:
User: "I want my refund"
You: "I'd be happy to help with your refund request. To proceed, I'll need your Transaction ID. It usually starts with 'TRX-'. Could you please provide it?"`,
      messages,
      maxSteps: 3,
      tools: {
        paymentHistory: {
          description: 'Retrieve user payment history. Use this ONLY if the user asks to see their payment history or past transactions.',
          parameters: z.object({ limit: z.number().optional().default(5) }),
          execute: async ({ limit }: { limit?: number }) => {
            return await ToolService.getPaymentHistory(userId, limit || 5);
          },
        },
      },
    });
  }
}
