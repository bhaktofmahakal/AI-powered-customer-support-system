import { generateText } from 'ai';
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
      const { text } = await generateText({
        model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
        system: `You are a routing agent for a customer support system. Analyze the user's message and determine which specialized agent should handle it.

Available agents:
- "support": General support questions, FAQs, product information, return policies, warranties, account issues
- "order": Order tracking, delivery status, order cancellation, shipping questions
- "billing": Payment issues, refunds, invoices, subscription queries, transaction status

Respond with a JSON object containing:
- agentType: one of "support", "order", or "billing"
- rationale: brief explanation of why you chose this agent (1-2 sentences)

Examples:
User: "Where is my order #ORD-1001?"
Response: {"agentType": "order", "rationale": "User is asking about order tracking and status."}

User: "I need a refund for transaction TXN_123"
Response: {"agentType": "billing", "rationale": "User is requesting a refund, which is a billing matter."}

User: "What is your return policy?"
Response: {"agentType": "support", "rationale": "User is asking about general policy information."}`,
        prompt: userMessage,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[Router] Failed to parse JSON, defaulting to support agent');
        return {
          agentType: 'support',
          rationale: 'Unable to classify query, routing to general support.',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = RouterResponseSchema.parse(parsed);

      console.log(`[Router] Classified as: ${validated.agentType} - ${validated.rationale}`);
      return validated as { agentType: 'support' | 'order' | 'billing'; rationale: string };
    } catch (e: any) {
      console.error('❌ Router Classification Failed:', e.message);
      return {
        agentType: 'support',
        rationale: 'Error during classification, defaulting to support agent.',
      };
    }
  }
}
