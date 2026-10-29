// Test if config.responseMimeType causes issues
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Test 1: with config (what the risk forecast uses)
console.log('Test 1: generateContent with config.responseMimeType...');
try {
  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Return pure JSON: {"status": "ok"}' }] }],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });
  console.log('Test 1 SUCCESS. Text:', res.text?.substring(0, 100));
} catch (e) {
  console.error('Test 1 FAILED:', e.status, e.message?.substring(0, 200));
}

// Test 2: with inlineData + config (what disease analysis uses)
console.log('\nTest 2: generateContent with inlineData + config.responseMimeType...');
try {
  // Just test text-only with same config as disease analysis
  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Return pure JSON: {"crop": "Tomato", "disease": "Healthy", "isHealthy": true, "confidence": 0.9, "severity": "None", "symptoms": [], "possibleCauses": [], "recommendations": [], "explanation": "Healthy", "needsExpertReview": false}' }] }],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });
  console.log('Test 2 SUCCESS. Text:', res.text?.substring(0, 100));
} catch (e) {
  console.error('Test 2 FAILED:', e.status, e.message?.substring(0, 200));
}

// Test 3: Check what response.text returns vs response.candidates
console.log('\nTest 3: Checking response structure...');
try {
  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }]
  });
  console.log('response keys:', Object.keys(res));
  console.log('response.text type:', typeof res.text);
  console.log('response.text value:', res.text?.substring(0, 50));
} catch (e) {
  console.error('Test 3 FAILED:', e.status, e.message);
}
