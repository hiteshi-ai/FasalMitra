// Test fallback models
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

for (const model of models) {
  console.log(`\nTesting model: ${model}`);
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: 'Reply with just: OK' }] }]
    });
    console.log(`  SUCCESS: ${res.text?.substring(0, 50)}`);
  } catch (e) {
    console.log(`  FAILED: HTTP ${e.status}, Code: ${e.code}, Msg: ${e.message?.substring(0, 100)}`);
  }
}
