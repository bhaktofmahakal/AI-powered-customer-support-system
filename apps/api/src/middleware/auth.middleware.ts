import { Context, Next } from 'hono';
import { AppError } from './error.middleware';
import { getToken } from 'next-auth/jwt';
import prisma from '../lib/db';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const isTestOrDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
    const hasTestFlag = c.req.header('x-test-auth') === 'true' || c.req.query('testAuth') === 'true';

    if (isTestOrDev && hasTestFlag) {
      c.set('userId', 'demo-user-id');
      return await next();
    }


    let token;
    try {
      token = await getToken({
        req: c.req.raw as any,
        secret: process.env.NEXTAUTH_SECRET,
      });
    } catch (err: any) {
      console.error('[AuthMiddleware] getToken error:', err.message);
      if (err.message?.includes('iterator')) {
      }
    }
    if (!token || !token.sub) {
      if (isTestOrDev) {
        console.warn('[AuthMiddleware] No token found, using demo user in dev');
        const demoUserId = 'demo-user-id';

        console.log('[AuthMiddleware] Upserting demo user...');
        await prisma.user.upsert({
          where: { id: demoUserId },
          update: {},
          create: {
            id: demoUserId,
            email: 'demo@example.com',
            name: 'Demo User',
          },
        });
        console.log('[AuthMiddleware] Demo user ready');

        c.set('userId', demoUserId);
        return await next();
      }
      throw new AppError(401, 'Unauthorized - Invalid or missing session');
    }

    const userId = token.sub;

    try {
      console.log(`[AuthMiddleware] Syncing user: ${userId}`);
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: token.email as string || `${userId}@example.com`,
          name: token.name as string || 'New User',
        },
      });
      console.log(`[AuthMiddleware] User synced: ${userId}`);
    } catch (err) {
      console.error('[AuthMiddleware] User upsert failed:', err);
    }

    c.set('userId', userId);
    await next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('[AuthMiddleware] Error:', error);
    if (process.env.NODE_ENV !== 'production') {
      c.set('userId', 'demo-user-id');
      return await next();
    }
    throw new AppError(401, 'Unauthorized - Auth verification failed');
  }
};

export const optionalAuth = async (c: Context, next: Next) => {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not defined');
    }

    const token = await getToken({
      req: c.req.raw as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token?.sub) {
      c.set('userId', token.sub);
    } else if (process.env.NODE_ENV !== 'production') {
      c.set('userId', 'demo-user-id');
    } else {
      throw new AppError(401, 'Unauthorized');
    }
    await next();
  } catch (error) {
    console.error('[AuthMiddleware] Optional auth error:', error);
    if (process.env.NODE_ENV !== 'production') {
      c.set('userId', 'demo-user-id');
      await next();
    } else {
      throw new AppError(401, 'Unauthorized');
    }
  }
};
