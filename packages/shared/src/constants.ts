export const AGENT_TYPES = {
  SUPPORT: 'support',
  ORDER: 'order',
  BILLING: 'billing',
} as const;

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUSES = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const INVOICE_STATUSES = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
} as const;

export const CONTEXT_SUMMARIZATION_THRESHOLD = 10;
export const RATE_LIMIT_PER_MINUTE = 20;
export const RATE_LIMIT_PER_HOUR = 100;
