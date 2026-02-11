import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = async (c: Context, next: Function) => {
  try {
    await next();
  } catch (err: any) {
    console.error('[Error Handler]', err);

    if (err instanceof HTTPException) {
      return c.json(
        {
          error: err.message,
          statusCode: err.status,
        },
        err.status
      );
    }

    if (err instanceof AppError) {
      return c.json(
        {
          error: err.message,
          statusCode: err.statusCode,
          details: err.details,
        },
        err.statusCode as any
      );
    }

    const isProd = process.env.NODE_ENV === 'production';
    return c.json(
      {
        error: 'Internal Server Error',
        message: isProd ? 'Internal Server Error' : (err.message || 'An unexpected error occurred'),
        statusCode: 500,
      },
      500
    );
  }
};
