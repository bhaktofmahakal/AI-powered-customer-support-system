async function testChat() {
    const baseUrl = 'http://localhost:3000/api/chat/messages?testAuth=true';
    const queries = [
        { label: 'General Support', query: 'What is your return policy?' },
        { label: 'Order Tracking', query: 'Where is my order #ORD-1001?' },
        { label: 'Billing/Refund', query: 'I need a refund for my last invoice.' }
    ];

    for (const q of queries) {
        console.log(`\n🤖 Testing Query [${q.label}]: "${q.query}"`);
        try {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: q.query })
            });

            if (!response.ok) {
                console.error(`❌ Request failed with status ${response.status}`);
                continue;
            }

            const body = response.body;
            if (!body) {
                console.error('❌ Response body is null');
                continue;
            }
            const reader = body.getReader();
            const decoder = new TextDecoder();
            let completeResponse = '';
            let agentType = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'text') {
                            completeResponse += data.content;
                        } else if (data.type === 'thinking') {
                            if (data.agentType) agentType = data.agentType;
                        } else if (data.type === 'done') {
                            console.log(`✅ Routed to: ${data.agentType}`);
                        }
                    }
                }
            }
            console.log(`📝 Response Preview: ${completeResponse.slice(0, 100)}...`);
        } catch (e: any) {
            console.error(`❌ Chat Test Failed:`, e.message);
        }
    }
}

testChat();
