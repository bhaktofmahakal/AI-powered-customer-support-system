import { hc } from 'hono/client';
import type { AppType } from './apps/api/src/index';

const baseUrl = 'http://localhost:3000';
const client = hc<AppType>(baseUrl);

async function testApi() {
    console.log('🚀 Starting API Integration Test...');

    // 1. Health Check
    try {
        const health = await client.api.health.$get();
        console.log('✅ Health Check:', await health.json());
    } catch (e: any) {
        console.error('❌ Health Check Failed:', e.message);
    }

    // 2. List Agents
    try {
        const agents = await client.api.agents.$get({
            query: { testAuth: 'true' }
        });
        console.log('✅ List Agents:', await agents.json());
    } catch (e: any) {
        console.error('❌ List Agents Failed:', e.message);
    }

    // 3. Get Capabilities
    try {
        const capabilities = await client.api.agents[':type'].capabilities.$get({
            param: { type: 'order' },
            query: { testAuth: 'true' }
        });
        console.log('✅ Order Agent Capabilities:', await capabilities.json());
    } catch (e: any) {
        console.error('❌ Get Capabilities Failed:', e.message);
    }

    // 4. List Conversations
    try {
        const convos = await client.api.chat.conversations.$get({
            query: { testAuth: 'true' }
        });
        console.log('✅ List Conversations:', await convos.json());
    } catch (e: any) {
        console.error('❌ List Conversations Failed:', e.message);
    }

    console.log('🏁 API Integration Test Finished.');
}

testApi();
