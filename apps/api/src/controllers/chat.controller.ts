import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AgentService } from '../services/agent.service';
import { ConversationService } from '../services/conversation.service';
import { AppError } from '../middleware/error.middleware';

export class ChatController {
  static async chat(c: Context) {
    const userId = c.get('userId');
    const { message, conversationId } = await c.req.json();

    if (!message) throw new AppError(400, 'Message is required');

    try {
      const result = await AgentService.processMessage({
        message,
        userId,
        conversationId,
      });

      return streamSSE(c, async (stream) => {
        try {
          let fullResponse = '';
          const toolCalls: any[] = [];

          // 1. Initial State
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'thinking',
              status: `Connecting to ${result.agentType} agent...`,
              agentType: result.agentType,
            }),
          });

          const modelResult = result.stream as any;
          const streamSource = modelResult.fullStream || modelResult.textStream;

          if (!streamSource) {
            const { text } = await modelResult;
            fullResponse = text;
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', content: text }) });
          } else {
            console.log(`[ChatController] Streaming started for user: ${userId}`);
            for await (const chunk of streamSource) {
              const type = (chunk as any).type;

              // Extract content from various possible chunk formats
              const delta = (chunk as any).textDelta || (chunk as any).delta || (chunk as any).content || (typeof chunk === 'string' ? chunk : null);

              if (delta && typeof delta === 'string') {
                fullResponse += delta;
                await stream.writeSSE({ data: JSON.stringify({ type: 'text', content: delta }) });
              } else if (type === 'tool-call') {
                const toolName = (chunk as any).toolName;
                toolCalls.push({ tool: toolName, args: (chunk as any).args });
                await stream.writeSSE({
                  data: JSON.stringify({ type: 'thinking', status: `Using tool: ${toolName}...` }),
                });
              } else if (type === 'tool-result') {
                await stream.writeSSE({
                  data: JSON.stringify({ type: 'thinking', status: 'Processing information...' }),
                });
              }
            }
          }

          // Fallback if no text was generated
          if (!fullResponse.trim() && toolCalls.length === 0) {
            fullResponse = "I'm analyzing your request. Could you please provide more details?";
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', content: fullResponse }) });
          }

          const debugTrace = {
            ...result.debugTrace,
            toolsCalled: toolCalls.map(t => t.tool)
          };

          // PERSIST
          await AgentService.saveAssistantMessage({
            conversationId: result.conversation.id,
            content: fullResponse,
            agentType: result.agentType,
            debugTrace,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          });

          // CLOSE
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'done',
              conversationId: result.conversation.id,
              agentType: result.agentType,
              debugTrace,
              toolCalls
            }),
          });

        } catch (err: any) {
          console.error('[ChatController] Stream error:', err);
          await stream.writeSSE({
            data: JSON.stringify({ type: 'text', content: `\n\n[Agent Error]: ${err.message}` })
          });
          await stream.writeSSE({ data: JSON.stringify({ type: 'done' }) });
        }
      });
    } catch (error: any) {
      console.error('[ChatController] Error:', error);
      throw new AppError(500, error.message);
    }
  }

  static async getConversations(c: Context) {
    const userId = c.get('userId');
    try {
      const conversations = await ConversationService.getConversations(userId);
      return c.json(conversations);
    } catch (error: any) {
      return c.json([], 500);
    }
  }

  static async getConversation(c: Context) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    try {
      const history = await ConversationService.getConversationHistory(id, userId);
      return c.json(history);
    } catch (error: any) {
      return c.json({ error: 'Not found' }, 404);
    }
  }

  static async deleteConversation(c: Context) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    try {
      await ConversationService.deleteConversation(id, userId);
      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: 'Delete failed' }, 500);
    }
  }
}
