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
      system: `You are a Billing and Refund Specialist.

CRITICAL INSTRUCTIONS:
1. If the user mentions a transaction ID (like TRX-123, TRANS-456, etc.), use the appropriate tool immediately.
2. For refund requests WITHOUT a transaction ID, ask for it politely.
3. For payment history requests, use the paymentHistory tool.
4. Always explain tool results in a friendly, helpful way.

Examples:
User: "I want a refund for TRX-789"
You: [Check transaction ownership, then explain refund process]

User: "I want my refund"
You: "I'd be happy to help with your refund. To proceed, I'll need your Transaction ID. It usually starts with 'TRX-'. Could you provide it?"

User: "Show my payment history"
You: [Call paymentHistory tool, then summarize the results]`,
      messages,
      maxSteps: 5,
      tools: {
        paymentHistory: {
          description: 'Retrieve user payment history. Use when user asks to see past transactions or payment history.',
          parameters: z.object({ limit: z.number().optional().default(5) }),
          execute: async ({ limit }: { limit?: number }) => {
            return await ToolService.getPaymentHistory(userId, limit || 5);
          },
        },
        invoiceDetails: {
          description: 'Get details of a specific invoice',
          parameters: z.object({
            invoiceNumber: z.string().describe('The invoice number')
          }),
          execute: async ({ invoiceNumber }: { invoiceNumber: string }) => {
            return await ToolService.getInvoiceDetails(invoiceNumber, userId);
          },
        },
      },
    });
  }
}
