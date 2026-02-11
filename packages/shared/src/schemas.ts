import { z } from 'zod';

export const AgentType = z.enum(['support', 'order', 'billing']);

export const MessageRole = z.enum(['user', 'assistant', 'system']);

export const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1),
});

export const ConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRole,
  content: z.string(),
  agentType: AgentType.nullable(),
  toolCalls: z.any().nullable(),
  debugTrace: z.any().nullable(),
  createdAt: z.date(),
});

export const DebugTraceSchema = z.object({
  selectedAgent: AgentType,
  rationale: z.string(),
  toolsCalled: z.array(z.string()),
});

export const RouterResponseSchema = z.object({
  agentType: AgentType,
  rationale: z.string(),
});

export type AgentType = z.infer<typeof AgentType>;
export type MessageRole = z.infer<typeof MessageRole>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type DebugTrace = z.infer<typeof DebugTraceSchema>;
export type RouterResponse = z.infer<typeof RouterResponseSchema>;
