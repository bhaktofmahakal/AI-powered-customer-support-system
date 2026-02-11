import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const RouterResponseSchema = z.object({
  agentType: z.enum(['support', 'order', 'billing']),
  rationale: z.string(),
});

export class RouterAgent {
  static async classifyIntent(userMessage: string): Promise<{
    agentType: 'support' | 'order' | 'billing';
    rationale: string;
  }> {
    try {
      console.log('[Router] Classifying user message:', userMessage);

      const { object } = await generateObject({
        model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
        schema: RouterResponseSchema,
        system: `You are a routing agent for a customer support system. Analyze the user's message and determine which specialized agent should handle it.

Available agents:
- "support": General support questions, FAQs, product information, return policies, warranties, account issues
- "order": Order tracking, delivery status, order cancellation, shipping questions
- "billing": Payment issues, refunds, invoices, subscription queries, transaction status`,
        prompt: userMessage,
      });

      console.log(`[Router] Classified as: ${object.agentType} - ${object.rationale}`);
      return object as { agentType: 'support' | 'order' | 'billing'; rationale: string };
    } catch (e: any) {
      console.error('❌ Router Classification Failed:', e.message);
      return {
        agentType: 'support',
        rationale: 'Error during classification, defaulting to support agent.',
      };
    }
  }
}
