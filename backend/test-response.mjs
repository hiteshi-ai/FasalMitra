// Check exact response.text behavior
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const res = await ai.models.generateContent({
  model: 'gemini-3.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Return JSON: {"status":"ok"}' }] }],
  config: {
    responseMimeType: 'application/json',
    temperature: 0.2
  }
});

console.log('typeof res.text:', typeof res.text);
console.log('res.text is function?', typeof res.text === 'function');
console.log('res.text value:', res.text);
console.log('');
console.log('res.candidates[0].content.parts[0].text:', res.candidates?.[0]?.content?.parts?.[0]?.text);

// Also check if parseGeminiJson would work with this
const rawText = res.text;
console.log('\nDirect access res.text:', rawText?.substring(0, 100));
