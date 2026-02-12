import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: 'AIzaSyAmCQRQOGNdC7G2Q-DM-EOXmmSdXM7tJS8',
});

async function testGemini() {
    try {
        const result = await generateText({
            model: google('models/gemini-2.0-flash') as any,
            prompt: 'Say hello in one sentence.',
        });
        console.log('✅ Gemini API is working!');
        console.log('Response:', result.text);
    } catch (error: any) {
        console.error('❌ Gemini API failed');
        console.error('Error:', error.message);
    }
}

testGemini();
