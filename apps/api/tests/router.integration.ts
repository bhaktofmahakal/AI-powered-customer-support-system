import 'dotenv/config';
import { RouterAgent } from '../src/agents/router.agent';

async function testRouter() {
    console.log('🧪 Testing Router Agent...');

    const testCases = [
        {
            query: 'Where is my order ORD-1002?',
            expected: 'order'
        },
        {
            query: 'I need a refund for my last payment',
            expected: 'billing'
        },
        {
            query: 'How can I return an item?',
            expected: 'support'
        }
    ];

    for (const tc of testCases) {
        console.log(`\nQuery: "${tc.query}"`);
        try {
            const result = await RouterAgent.classifyIntent(tc.query);
            console.log(`Result: ${result.agentType}`);
            console.log(`Rationale: ${result.rationale}`);
            if (result.agentType === tc.expected) {
                console.log('✅ Match');
            } else {
                console.log(`❌ Mismatch (Expected ${tc.expected})`);
            }
        } catch (e) {
            console.error('❌ Test failed with error:', e);
        }
    }
}

testRouter();
