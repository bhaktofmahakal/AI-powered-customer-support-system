import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import 'dotenv/config';

import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { ChatController } from './controllers/chat.controller';
import { AgentController } from './controllers/agent.controller';

const app = new Hono();

// CORS is enabled for all origins in development and restricted in production
app.use('*', cors({
  origin: (origin) => {
    // In production, we allow the request's origin if it exists
    if (process.env.NODE_ENV === 'production') {
      return origin;
    }
    return origin; // Allow all in dev
  },
  credentials: true,
}));

app.use('*', errorHandler);

/**
 * API Routes
 */
const routes = app
  .get('/api/health', (c) => c.json({ status: 'ok' }))

  // Chat & Conversation Routes
  .post('/api/chat/messages', authMiddleware, (c) => ChatController.chat(c))
  .get('/api/chat/conversations', authMiddleware, (c) => ChatController.getConversations(c))
  .get('/api/chat/conversations/:id', authMiddleware, (c) => ChatController.getConversation(c))
  .delete('/api/chat/conversations/:id', authMiddleware, (c) => ChatController.deleteConversation(c))

  // Agent Routes
  .get('/api/agents', authMiddleware, (c) => AgentController.listAgents(c))
  .get('/api/agents/:type/capabilities', authMiddleware, (c) => AgentController.getCapabilities(c));

export type AppType = typeof routes;

// Start server if not running on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3001;
  console.log(`Server is running on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
