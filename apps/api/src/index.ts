import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import 'dotenv/config';

import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { ChatController } from './controllers/chat.controller';
import { AgentController } from './controllers/agent.controller';

const app = new Hono();

app.use('*', requestLogger);
app.use('*', cors({
  origin: (origin) => {
    // Allow same-origin, localhost, and any vercel.app domain
    if (!origin) return '*';
    if (origin.includes('localhost') || origin.includes('vercel.app')) {
      return origin;
    }
    return origin;
  },
  credentials: true,
}));
app.use('*', errorHandler);

const routes = app
  .get('/api/health', (c) => c.json({ status: 'ok' }))

  .post('/api/chat/messages', authMiddleware, (c) => ChatController.sendMessage(c))
  .get('/api/chat/conversations', authMiddleware, (c) => ChatController.getConversations(c))
  .get('/api/chat/conversations/:id', authMiddleware, (c) => ChatController.getConversation(c))
  .delete('/api/chat/conversations/:id', authMiddleware, (c) => ChatController.deleteConversation(c))

  .get('/api/agents', authMiddleware, (c) => AgentController.listAgents(c))
  .get('/api/agents/:type/capabilities', authMiddleware, (c) => AgentController.getCapabilities(c));

export type AppType = typeof routes;

export default app;

const isMain = import.meta.url === `file://${process.argv[1]}`;
const forceDev = process.env.START_DEV_SERVER === 'true';

if (isMain || forceDev) {
  const port = Number(process.env.PORT) || 3005;
  console.log(`🚀 API Server starting on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    console.log(`🚀 API Server listening on http://localhost:${info.port}`);
  });
}
