import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import prisma from '../lib/db';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const SUMMARIZATION_THRESHOLD = 10;

export class ConversationService {
  static async getOrCreateConversation(userId: string, conversationId?: string) {
    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (existing) return existing;
    }

    return prisma.conversation.create({
      data: {
        userId,
        title: 'New conversation',
      },
    });
  }

  static async getConversationHistory(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        summary: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const parsedMessages = conversation.messages.map((msg: any) => ({
      ...msg,
      debugTrace: this.safeParseJson(msg.debugTrace),
      toolCalls: this.safeParseJson(msg.toolCalls),
    }));

    const messageCount = parsedMessages.length;

    if (messageCount <= SUMMARIZATION_THRESHOLD) {
      return {
        conversation,
        messages: parsedMessages,
        hasSummary: false,
        summary: null,
      };
    }

    const recentMessages = parsedMessages.slice(-SUMMARIZATION_THRESHOLD);
    const oldMessages = parsedMessages.slice(0, -SUMMARIZATION_THRESHOLD);

    let summary = conversation.summary;
    if (!summary || summary.messageCount !== oldMessages.length) {
      const summaryText = await this.generateSummary(oldMessages);
      summary = await prisma.conversationSummary.upsert({
        where: { conversationId },
        create: {
          conversationId,
          summary: summaryText,
          messageCount: oldMessages.length,
        },
        update: {
          summary: summaryText,
          messageCount: oldMessages.length,
        },
      });
    }

    return {
      conversation,
      messages: recentMessages,
      summary: summary.summary,
      hasSummary: true,
    };
  }

  static buildContextForAgent(history: {
    messages: any[];
    hasSummary: boolean;
    summary: string | null;
  }): string | null {
    if (!history.hasSummary || !history.summary) return null;
    return `[Previous conversation summary]: ${history.summary}`;
  }

  static async addMessage(params: {
    conversationId: string;
    role: string;
    content: string;
    agentType?: string;
    toolCalls?: any;
    debugTrace?: any;
  }) {
    const message = await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        agentType: params.agentType,
        toolCalls: params.toolCalls ?? undefined,
        debugTrace: params.debugTrace ?? undefined,
      },
    });

    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    });

    if (params.role === 'user') {
      const conversation = await prisma.conversation.findUnique({
        where: { id: params.conversationId },
        include: { messages: { where: { role: 'user' } } },
      });

      if (
        conversation &&
        conversation.title === 'New conversation' &&
        conversation.messages.length === 1
      ) {
        const title = params.content.slice(0, 50) + (params.content.length > 50 ? '...' : '');
        await prisma.conversation.update({
          where: { id: params.conversationId },
          data: { title },
        });
      }
    }

    return message;
  }

  static async getConversations(userId: string, limit: number = 20) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  static async deleteConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  static async userOwnsConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      });
      return conv?.userId === userId;
    } catch {
      return false;
    }
  }

  private static safeParseJson(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  private static async generateSummary(messages: any[]): Promise<string> {
    const conversationText = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const { text } = await generateText({
        model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile') as any,
        system:
          'Summarize the following conversation history concisely, preserving key context, user preferences, and unresolved issues. Keep it under 200 words.',
        prompt: conversationText,
      });

      return text;
    } catch (error) {
      console.error('[ConversationService] Summarization error:', error);
      return 'Previous conversation context (summarization failed)';
    }
  }
}
