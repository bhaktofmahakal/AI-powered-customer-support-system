import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AgentService } from '../services/agent.service';
import { ConversationService } from '../services/conversation.service';
import { AppError } from '../middleware/error.middleware';

export class ChatController {
  static async chat(c: Context) {
    const userId = c.get('userId');
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    try {
      const body = await c.req.json();
      const { message, conversationId } = body;

      console.log('[ChatController] New message request:', {
        messageLength: message?.length,
        conversationId,
        userId
      });

      if (!message || typeof message !== 'string') {
        throw new AppError(400, 'Message is required and must be a string');
      }

      if (message.length > 4000) {
        throw new AppError(400, 'Message too long. Maximum 4000 characters.');
      }

      const result = await AgentService.processMessage({
        message,
        userId,
        conversationId,
      });

      console.log('[ChatController] Agent result obtained, starting stream');

      return streamSSE(c, async (stream) => {
        let fullResponse = '';
        const toolCalls: any[] = [];

        try {
          if (!result.stream || !result.stream.fullStream) {
            console.error('[ChatController] Agent returned invalid stream');
            await stream.writeSSE({
              event: 'error',
              data: JSON.stringify({ error: 'Agent failed to initialize stream' }),
            });
            return;
          }

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'thinking',
              status: 'Analyzing your request...',
              agentType: result.agentType,
            }),
          });

          for await (const chunk of result.stream.fullStream) {
            if (chunk.type === 'text-delta') {
              fullResponse += chunk.textDelta;
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'text',
                  content: chunk.textDelta,
                }),
              });
            } else if (chunk.type === 'tool-call') {
              toolCalls.push({
                tool: chunk.toolName,
                args: chunk.args,
              });
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'tool-call',
                  toolName: chunk.toolName,
                  args: chunk.args,
                }),
              });
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'thinking',
                  status: `Searching ${chunk.toolName}...`,
                }),
              });
            } else if (chunk.type === 'tool-result') {
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'tool-result',
                  toolName: chunk.toolName,
                  result: chunk.result,
                }),
              });
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'thinking',
                  status: 'Composing response...',
                }),
              });
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
          console.error('[ChatController] Stream error:', error);
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'error',
              message: 'An error occurred during response streaming',
            }),
          });
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('[ChatController] Processing error:', error);
      throw new AppError(500, 'Failed to process message');
    }
  }

  static async sendMessage(c: Context) {
    return ChatController.chat(c);
  }

  static async getConversations(c: Context) {
    const userId = c.get('userId');
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    try {
      const conversations = await ConversationService.getConversations(userId);
      return c.json({ conversations });
    } catch (error: any) {
      console.error('[ChatController] getConversations error:', error);
      throw new AppError(500, 'Failed to fetch conversations');
    }
  }

  static async getConversation(c: Context) {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    try {
      const result = await ConversationService.getConversationHistory(conversationId, userId);
      return c.json({
        conversation: result.conversation,
        messages: result.messages,
        summary: result.hasSummary ? result.summary : null,
      });
    } catch (error: any) {
      console.error('[ChatController] getConversation error:', error);
      if (error.message === 'Conversation not found') {
        throw new AppError(404, 'Conversation not found');
      }
      throw new AppError(500, 'Failed to fetch conversation');
    }
  }

  static async deleteConversation(c: Context) {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    try {
      await ConversationService.deleteConversation(conversationId, userId);
      return c.json({ success: true });
    } catch (error: any) {
      console.error('[ChatController] deleteConversation error:', error);
      if (error.message?.includes('not found')) {
        throw new AppError(404, 'Conversation not found');
      }
      throw new AppError(500, 'Failed to delete conversation');
    }
  }
}
