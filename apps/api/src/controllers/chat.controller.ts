import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AgentService } from '../services/agent.service';
import { ConversationService } from '../services/conversation.service';
import { AppError } from '../middleware/error.middleware';

export class ChatController {
  static async chat(c: Context) {
    const userId = c.get('userId');
    const { message, conversationId } = await c.req.json();

    if (!message) {
      throw new AppError(400, 'Message is required');
    }

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

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'thinking',
              status: 'Routing to ' + result.agentType + ' agent...',
              agentType: result.agentType,
            }),
          });

          const fullStream = (result.stream as any).fullStream;

          if (!fullStream) {
            const { text } = await result.stream;
            fullResponse = text;
            await stream.writeSSE({
              data: JSON.stringify({ type: 'text', content: text }),
            });
          } else {
            for await (const chunk of fullStream) {
              try {
                const type = (chunk as any).type;

                if (type === 'text-delta') {
                  // ROBUST: Check all possible text fields to avoid 'undefined'
                  const delta = (chunk as any).textDelta || (chunk as any).text || (chunk as any).content || '';
                  if (delta) {
                    fullResponse += delta;
                    await stream.writeSSE({
                      data: JSON.stringify({ type: 'text', content: delta }),
                    });
                  }
                } else if (type === 'tool-call') {
                  toolCalls.push({
                    tool: (chunk as any).toolName,
                    args: (chunk as any).args,
                  });
                  await stream.writeSSE({
                    data: JSON.stringify({
                      type: 'thinking',
                      status: `Using ${(chunk as any).toolName}...`,
                    }),
                  });
                } else if (type === 'tool-result') {
                  await stream.writeSSE({
                    data: JSON.stringify({
                      type: 'thinking',
                      status: 'Processing results...',
                    }),
                  });
                }
              } catch (chunkErr: any) {
                console.warn('[ChatController] Chunk error:', chunkErr.message);
              }
            }
          }

          const finalDebugTrace = {
            ...result.debugTrace,
            toolsCalled: toolCalls.map((t) => t.tool),
          };

          await AgentService.saveAssistantMessage({
            conversationId: result.conversation.id,
            content: fullResponse,
            agentType: result.agentType,
            debugTrace: finalDebugTrace,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          });

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'done',
              conversationId: result.conversation.id,
              agentType: result.agentType,
              debugTrace: finalDebugTrace,
              toolCalls: toolCalls,
            }),
          });

        } catch (error: any) {
          console.error('[ChatController] Stream error:', error.message);
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'text',
              content: '\n\n[System Error]: ' + error.message,
            }),
          });
          await stream.writeSSE({ data: JSON.stringify({ type: 'done' }) });
        }
      });
    } catch (error: any) {
      console.error('[ChatController] Error:', error.message);
      throw new AppError(500, error.message);
    }
  }

  static async getConversations(c: Context) {
    const userId = c.get('userId');
    try {
      const conversations = await ConversationService.getConversations(userId);
      return c.json(conversations);
    } catch (error: any) {
      return c.json({ error: 'Failed to fetch conversations' }, 500);
    }
  }

  static async getConversation(c: Context) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    try {
      const history = await ConversationService.getConversationHistory(id, userId);
      return c.json(history);
    } catch (error: any) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
  }

  static async deleteConversation(c: Context) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    try {
      const result = await ConversationService.deleteConversation(id, userId);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: 'Failed to delete' }, 500);
    }
  }
}
