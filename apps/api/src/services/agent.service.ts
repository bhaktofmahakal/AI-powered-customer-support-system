import { RouterAgent } from '../agents/router.agent';
import { SupportAgent } from '../agents/support.agent';
import { OrderAgent } from '../agents/order.agent';
import { BillingAgent } from '../agents/billing.agent';
import { ConversationService } from './conversation.service';

export class AgentService {
  static async processMessage(params: {
    message: string;
    userId: string;
    conversationId?: string;
  }) {
    const { message, userId, conversationId } = params;

    console.log('[AgentService] Processing message for user:', userId);

    const conversation = await ConversationService.getOrCreateConversation(
      userId,
      conversationId
    );

    const history = await ConversationService.getConversationHistory(
      conversation.id,
      userId
    );

    const routingResult = await RouterAgent.classifyIntent(message);

    console.log(
      `[AgentService] Routed to ${routingResult.agentType} agent: ${routingResult.rationale}`
    );

    const conversationHistory: any[] = [];

    const contextSummary = ConversationService.buildContextForAgent(history);
    if (contextSummary) {
      conversationHistory.push({
        role: 'system',
        content: contextSummary,
      });
    }

    for (const msg of history.messages) {
      if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
        conversationHistory.push({
          role: msg.role as any,
          content: msg.content || '',
        });
      }
    }

    await ConversationService.addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });

    conversationHistory.push({
      role: 'user',
      content: message,
    });

    let agentStream: any;
    const debugTrace = {
      selectedAgent: routingResult.agentType,
      rationale: routingResult.rationale,
      contextCompacted: history.hasSummary,
      toolsCalled: [] as string[],
    };

    switch (routingResult.agentType) {
      case 'support':
        agentStream = await SupportAgent.handleQuery(
          message,
          conversationHistory,
          userId,
          conversation.id
        );
        break;
      case 'order':
        agentStream = await OrderAgent.handleQuery(
          message,
          conversationHistory,
          userId,
          conversation.id
        );
        break;
      case 'billing':
        agentStream = await BillingAgent.handleQuery(
          message,
          conversationHistory,
          userId,
          conversation.id
        );
        break;
      default:
        agentStream = await SupportAgent.handleQuery(
          message,
          conversationHistory,
          userId,
          conversation.id
        );
    }

    return {
      stream: agentStream,
      conversation,
      debugTrace,
      agentType: routingResult.agentType,
    };
  }

  static async saveUserMessage(params: {
    conversationId: string;
    content: string;
    userId: string;
  }) {
    return ConversationService.addMessage({
      conversationId: params.conversationId,
      role: 'user',
      content: params.content,
    });
  }

  static async saveAssistantMessage(params: {
    conversationId: string;
    content: string;
    agentType: 'support' | 'order' | 'billing';
    debugTrace: any;
    toolCalls?: any;
  }) {
    return ConversationService.addMessage({
      conversationId: params.conversationId,
      role: 'assistant',
      content: params.content,
      agentType: params.agentType,
      debugTrace: params.debugTrace,
      toolCalls: params.toolCalls,
    });
  }
}
