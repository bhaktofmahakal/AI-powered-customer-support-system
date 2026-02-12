import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
    const genAI = new GoogleGenerativeAI('AIzaSyAmCQRQOGNdC7G2Q-DM-EOXmmSdXM7tJS8');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('List all models');
        console.log('Gemini Status: OK');
        console.log('Response:', result.response.text());
    } catch (error: any) {
        console.error('Gemini Status: FAILED');
        console.error('Error:', error.message);
    }
}

listModels();
