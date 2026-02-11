import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { ToolService } from '../services/tool.service';
import { ConversationService } from '../services/conversation.service';

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
    const systemPrompt = `You are a helpful customer support agent.`;

    return (streamText as any)({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: conversationHistory,
      maxSteps: 5,
      tools: {
        searchFAQ: {
          description: 'Search the FAQ database',
          parameters: z.object({
            query: z.string(),
          }),
          execute: async ({ query }: { query: string }) => {
            return await ToolService.searchFAQ(query, userId);
          },
        },
        queryHistory: {
          description: 'Get conversation history',
          parameters: z.object({
            limit: z.number().optional().default(10),
          }),
          execute: async ({ limit }: { limit: number }) => {
            if (!conversationId) return { found: false, messages: [] };

            const isOwner = await ConversationService.userOwnsConversation(conversationId, userId);
            if (!isOwner) return { found: false, messages: [], error: 'Unauthorized' };

            const history = await ToolService.queryConversationHistory(conversationId, userId, limit);
            return { found: true, messages: history };
          },
        },
      },
    });
  }
}
