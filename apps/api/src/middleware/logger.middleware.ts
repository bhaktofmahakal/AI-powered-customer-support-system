import { Context, Next } from 'hono';

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;

  try {
    await next();
  } finally {
    const duration = Date.now() - start;
    const status = c.res.status;
    console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} - ${duration}ms`);
  }
};
