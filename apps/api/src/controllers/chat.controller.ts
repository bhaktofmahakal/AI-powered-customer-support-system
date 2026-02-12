import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AgentService } from '../services/agent.service';
import { ConversationService } from '../services/conversation.service';
import { AppError } from '../middleware/error.middleware';

export class ChatController {
  /**
   * Main chat endpoint
   */
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

          // Initial thinking status
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'thinking',
              status: `Connecting to ${result.agentType} agent...`,
              agentType: result.agentType,
            }),
          });

          // Process the stream
          const modelResult = result.stream as any;
          // Support both fullStream (v4) and general async iterator
          const streamSource = modelResult.fullStream || modelResult;

          if (streamSource && typeof (streamSource as any)[Symbol.asyncIterator] === 'function') {
            for await (const chunk of streamSource as any) {
              const type = chunk.type;
              // Extract text delta carefully
              const delta = chunk.textDelta || chunk.delta || (typeof chunk === 'string' ? chunk : null);

              // Filter out null, undefined, and the string 'null'
              if (delta && delta !== 'null' && delta !== 'undefined' && typeof delta === 'string' && delta.trim()) {
                fullResponse += delta;
                await stream.writeSSE({
                  data: JSON.stringify({ type: 'text', content: delta }),
                });
              } else if (type === 'tool-call') {
                toolCalls.push({ tool: chunk.toolName, args: chunk.args });
                await stream.writeSSE({
                  data: JSON.stringify({
                    type: 'thinking',
                    status: `Agent is using ${chunk.toolName}...`
                  }),
                });
              }
            }
          } else {
            // Fallback for non-streaming
            const { text } = await modelResult;
            fullResponse = text;
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', content: text }) });
          }

          // FINAL FALLBACK: If AI remained silent, give a better context-aware message
          if (!fullResponse.trim() && toolCalls.length === 0) {
            fullResponse = `I am ready to help with your ${result.agentType} request. Could you please provide more details so I can assist you better?`;
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', content: fullResponse }) });
          }

          const debugTrace = {
            ...result.debugTrace,
            toolsCalled: toolCalls.map(t => t.tool)
          };

          // Save to DB
          await AgentService.saveAssistantMessage({
            conversationId: result.conversation.id,
            content: fullResponse,
            agentType: result.agentType as any,
            debugTrace,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          });

          // Final close event
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'done',
              conversationId: result.conversation.id,
              agentType: result.agentType,
              debugTrace,
              toolCalls
            }),
          });

        } catch (error: any) {
          console.error('[ChatController] Stream internal error:', error);
          await stream.writeSSE({
            data: JSON.stringify({ type: 'text', content: `\n\n[Agent Error]: ${error.message}` })
          });
          await stream.writeSSE({ data: JSON.stringify({ type: 'done' }) });
        }
      });
    } catch (error: any) {
      console.error('[ChatController] Critical Error:', error);
      throw new AppError(500, error.message);
    }
  }

  static async getConversations(c: Context) {
    const userId = c.get('userId');
    try {
      const conversations = await ConversationService.getConversations(userId);
      return c.json(conversations || []);
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
      return c.json({ error: 'Failed' }, 500);
    }
  }
}
