import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export class RouterAgent {
  static async classifyIntent(userMessage: string): Promise<{
    agentType: 'support' | 'order' | 'billing';
    rationale: string;
  }> {
    try {
      console.log('[Router] Classifying:', userMessage);

      const { text } = await generateText({
        model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
        system: `You are a routing agent. Determine the best specialist for the user message.
Respond ONLY with a JSON object: {"agentType": "support" | "order" | "billing", "rationale": "reason"}

Mapping:
- billing: refunds, payments, invoices, transactions
- order: tracking, delivery, cancellations
- support: everything else, general FAQs`,
        prompt: userMessage,
      });

      // Flexible JSON parsing
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        agentType: parsed.agentType || 'support',
        rationale: parsed.rationale || 'Defaulted to support',
      };
    } catch (e: any) {
      console.error('❌ Router Error:', e.message);
      return {
        agentType: 'support',
        rationale: 'Error during classification, defaulting to support agent.',
      };
    }
  }
}
