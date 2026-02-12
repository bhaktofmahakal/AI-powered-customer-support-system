import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AgentService } from '../services/agent.service';
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

          // Send initial thinking indicator
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'thinking',
              status: 'Routing to ' + result.agentType + ' agent...',
              agentType: result.agentType,
            }),
          });

          // Process the stream
          // Using as any to bypass internal chunk type checks that might crash on v1beta/experimental chunks
          const fullStream = (result.stream as any).fullStream;

          if (!fullStream) {
            // Fallback if fullStream is not available
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
                  const delta = (chunk as any).textDelta;
                  fullResponse += delta;
                  await stream.writeSSE({
                    data: JSON.stringify({ type: 'text', content: delta }),
                  });
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
                      status: 'Composing response...',
                    }),
                  });
                } else {
                  // SILENTLY skip stream-start, response-metadata, usage, etc.
                  console.log(`[ChatController] Skipping meta chunk: ${type}`);
                }
              } catch (chunkErr: any) {
                console.error('[ChatController] Chunk processing error:', chunkErr.message);
              }
            }
          }

          const finalDebugTrace = {
            ...result.debugTrace,
            toolsCalled: toolCalls.map((t) => t.tool),
          };

          // Save assistant message
          await AgentService.saveAssistantMessage({
            conversationId: result.conversation.id,
            content: fullResponse,
            agentType: result.agentType,
            debugTrace: finalDebugTrace,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          });

          // Final event
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
          // If we already sent some text, don't crash the whole UI
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
      console.error('[ChatController] Outer error:', error.message);
      throw new AppError(500, error.message);
    }
  }
}
