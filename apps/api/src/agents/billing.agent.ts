import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { ToolService } from '../services/tool.service';
import { ConversationService } from '../services/conversation.service';

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
    const systemPrompt = `You are a billing specialist. You assist users with payments, refunds, and invoice queries.
Confirm transaction details before initiating workflows.`;

    return (streamText as any)({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
      system: systemPrompt,
      messages: conversationHistory,
      maxSteps: 5,
      tools: {
        processRefund: {
          description: 'Initiate a refund for a transaction.',
          parameters: z.object({ transactionId: z.string(), amount: z.number() }),
          execute: async ({ transactionId, amount }: { transactionId: string, amount: number }) => {
            try {
              const isOwner = await ToolService.verifyTransactionOwnership(transactionId, userId);
              if (!isOwner) return { success: false, message: 'Unauthorized or transaction not found.' };

              const { processRefundWorkflow } = await import('../workflows/refund.workflow');
              await processRefundWorkflow(transactionId, amount);
              return { success: true, message: `Refund initiated for ${transactionId}.` };
            } catch (err: any) {
              return { success: false, message: err.message };
            }
          },
        },
        invoiceDetails: {
          description: 'Get details of an invoice',
          parameters: z.object({ invoiceNumber: z.string() }),
          execute: async ({ invoiceNumber }: { invoiceNumber: string }) => {
            return await ToolService.getInvoiceDetails(invoiceNumber, userId);
          },
        },
        paymentHistory: {
          description: 'Get user payment history',
          parameters: z.object({ limit: z.number().optional().default(10) }),
          execute: async ({ limit }: { limit: number }) => {
            return await ToolService.getPaymentHistory(userId, limit);
          },
        },
      },
    });
  }
}
