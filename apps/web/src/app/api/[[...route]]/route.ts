import { handle } from 'hono/vercel';

const getApp = async () => {
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
export const maxDuration = 60;

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
