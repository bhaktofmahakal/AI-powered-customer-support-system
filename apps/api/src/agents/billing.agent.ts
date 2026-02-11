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
    const systemPrompt = `You are a billing specialist. Your primary role is to assist users with billing-related queries, process refunds, and provide information about their transaction history.
Be polite and helpful.
When processing refunds, always confirm the transaction ID and amount with the user before initiating the workflow.`;


    return (streamText as any)({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: conversationHistory,
      maxSteps: 5,
      tools: {
        processRefund: {
          description: 'Process refund workflow for a transaction. Only use this if you have a valid transactionId and amount.',
          parameters: z.object({ transactionId: z.string(), amount: z.number() }),
          execute: async ({ transactionId, amount }: { transactionId: string, amount: number }) => {
            try {
              if (amount <= 0) {
                return { success: false, message: 'Refund amount must be greater than zero.' };
              }

              const isOwner = await ToolService.verifyTransactionOwnership(transactionId, userId);
              if (!isOwner) {
                return { success: false, message: 'Transaction not found or you do not have permission to refund it.' };
              }

              const { start } = await import('workflow/api');
              const { processRefundWorkflow } = await import('../workflows/refund.workflow');
              await start(processRefundWorkflow, [transactionId, amount]);
              return { success: true, message: `Refund workflow for $${amount} has been initiated for transaction ${transactionId}.` };
            } catch (err: any) {
              console.error('[BillingAgent] processRefund error:', err);
              return { success: false, message: `An error occurred while processing the refund: ${err.message}` };
            }
          },
        },
        invoiceDetails: {
          description: 'Get details of a specific invoice',
          parameters: z.object({ invoiceNumber: z.string() }),
          execute: async ({ invoiceNumber }: { invoiceNumber: string }) => {
            return await ToolService.getInvoiceDetails(invoiceNumber, userId);
          },
        },
        refundStatus: {
          description: 'Check the status of a previously initiated refund',
          parameters: z.object({ transactionId: z.string() }),
          execute: async ({ transactionId }: { transactionId: string }) => {
            return await ToolService.checkRefundStatus(transactionId, userId);
          },
        },
        paymentHistory: {
          description: 'Get the payment history for the current user',
          parameters: z.object({ limit: z.number().optional().default(10) }),
          execute: async ({ limit }: { limit: number }) => {
            return await ToolService.getPaymentHistory(userId, limit);
          },
        },
        queryHistory: {
          description: 'Search through previous conversation history for context',
          parameters: z.object({ limit: z.number().optional().default(10) }),
          execute: async ({ limit }: { limit: number }) => {
            if (!conversationId) return { found: false, messages: [] };

            const isOwner = await ConversationService.userOwnsConversation(conversationId, userId);
            if (!isOwner) return { found: false, messages: [], error: 'Unauthorized access to history' };

            const history = await ToolService.queryConversationHistory(conversationId, userId, limit);
            return { found: true, messages: history };
          },
        },
      },
    });
  }
}
