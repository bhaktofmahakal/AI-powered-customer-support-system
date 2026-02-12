
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
    const genAI = new GoogleGenerativeAI('AIzaSyAmCQRQOGNdC7G2Q-DM-EOXmmSdXM7tJS8');
    // ... (Wait, there's no `listModels` method on `genAI`. I need to use `genAI.getGenerativeModel` but first check if I can list them.)
    // Ah, the SDK doesn't expose listModels directly. I need to make a raw fetch.
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAmCQRQOGNdC7G2Q-DM-EOXmmSdXM7tJS8`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const names = data.models.map((m: any) => m.name);
        console.log('Available Models:', JSON.stringify(names, null, 2));
        // console.log('Available Models:', JSON.stringify(data.models, null, 2));
    } catch (error: any) {
        console.error('Error fetching models:', error.message);
    }
}

listModels();
