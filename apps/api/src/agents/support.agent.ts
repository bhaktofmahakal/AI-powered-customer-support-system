import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { ToolService } from '../services/tool.service';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export class SupportAgent {
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
      system: `You are a Support Specialist. 
- Use searchFAQ to find answers.
- Be concise and helpful.`,
      messages,
      maxSteps: 5,
      tools: {
        searchFAQ: {
          description: 'Search the FAQ database',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }: { query: string }) => {
            return await ToolService.searchFAQ(query, userId);
          },
        },
      },
    });
  }
}
