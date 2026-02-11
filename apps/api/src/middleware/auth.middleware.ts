import { Context, Next } from 'hono';
import { AppError } from './error.middleware';
import { getToken } from 'next-auth/jwt';
import prisma from '../lib/db';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Try to extract JWT token from NextAuth session cookie
    let token;
    try {
      token = await getToken({
        req: c.req.raw as any,
        secret: process.env.NEXTAUTH_SECRET,
      });
    } catch (err: any) {
      console.error('[AuthMiddleware] getToken error:', err.message);
      // getToken can fail on Vercel with "Malformed input to a URL function"
      // when the request URL doesn't have a proper base. Try a workaround:
      try {
        const cookieHeader = c.req.header('cookie') || '';
        const sessionToken = cookieHeader
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='));

        if (sessionToken) {
          // Extract just the token value
          const tokenValue = sessionToken.split('=').slice(1).join('=');
          // Decode the JWT manually using next-auth's decode
          const { decode } = await import('next-auth/jwt');
          token = await decode({
            token: tokenValue,
            secret: process.env.NEXTAUTH_SECRET || '',
          });
        }
      } catch (fallbackErr: any) {
        console.error('[AuthMiddleware] Fallback token extraction failed:', fallbackErr.message);
      }
    }

    if (token && token.sub) {
      const userId = token.sub;

      // Sync user to database
      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: (token.email as string) || `${userId}@user.com`,
            name: (token.name as string) || 'User',
          },
        });
      } catch (err) {
        console.error('[AuthMiddleware] User upsert failed:', err);
      }

      c.set('userId', userId);
      return await next();
    }

    // No valid token found
    console.warn('[AuthMiddleware] No valid token found');
    throw new AppError(401, 'Unauthorized - Please sign in');
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('[AuthMiddleware] Unexpected error:', error);
    throw new AppError(401, 'Unauthorized - Auth verification failed');
  }
};
