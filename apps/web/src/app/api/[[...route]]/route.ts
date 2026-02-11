import { handle } from 'hono/vercel';


const getApp = async () => {
    // apps/web/src/app/api/[[...route]]/route.ts
    // 1: [[...route]], 2: api, 3: app, 4: src, 5: web, 6: apps
    const mod = await import('../../../../../../apps/api/src/index');
    return mod.default;
};

let appPromise: ReturnType<typeof getApp> | null = null;

function getOrCreateApp() {
    if (!appPromise) {
        appPromise = getApp();
    }
    return appPromise;
}

export const runtime = 'nodejs';

export const GET = async (req: Request) => {
    const app = await getOrCreateApp();
    return handle(app)(req);
};

export const POST = async (req: Request) => {
    const app = await getOrCreateApp();
    return handle(app)(req);
};

export const PUT = async (req: Request) => {
    const app = await getOrCreateApp();
    return handle(app)(req);
};

export const DELETE = async (req: Request) => {
    const app = await getOrCreateApp();
    return handle(app)(req);
};

export const PATCH = async (req: Request) => {
    const app = await getOrCreateApp();
    return handle(app)(req);
};
