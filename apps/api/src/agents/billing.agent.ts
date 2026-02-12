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
    console.log(`[BillingAgent] Processing query for user: ${userId}`);

    return (streamText as any)({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
      system: `You are an expert Billing Specialist. 
Your goal is to assist users with payments, refunds, and invoices.
1. ALWAYS acknowledge the user's request immediately in your first response.
2. If the user wants a refund, you MUST ask for the Transaction ID if they haven't provided it.
3. Use the tools available to check facts before making promises.
4. Keep your responses concise but professional.`,
      messages: conversationHistory,
      maxSteps: 5,
      tools: {
        processRefund: {
          description: 'Initiate a refund. Requires a valid transactionId.',
          parameters: z.object({
            transactionId: z.string().describe('The unique ID of the transaction to refund'),
            amount: z.number().describe('The amount to refund')
          }),
          execute: async ({ transactionId, amount }: { transactionId: string, amount: number }) => {
            const isOwner = await ToolService.verifyTransactionOwnership(transactionId, userId);
            if (!isOwner) return { success: false, message: 'Unauthorized: You do not own this transaction.' };

            const { processRefundWorkflow } = await import('../workflows/refund.workflow');
            await processRefundWorkflow(transactionId, amount);
            return { success: true, message: `Refund of $${amount} for ${transactionId} has been queued.` };
          },
        },
        paymentHistory: {
          description: 'Fetch the user payment history.',
          parameters: z.object({ limit: z.number().optional().default(5) }),
          execute: async ({ limit }: { limit: number }) => {
            return await ToolService.getPaymentHistory(userId, limit);
          },
        }
      },
    });
  }
}
