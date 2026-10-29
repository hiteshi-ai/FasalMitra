// Test risk forecast flow directly
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { estimateDiseaseRisk } from './services/geminiService.js';

console.log('Testing estimateDiseaseRisk...');
console.log('API Key present:', Boolean(process.env.GEMINI_API_KEY));

try {
  const result = await estimateDiseaseRisk({
    crop: 'Tomato',
    cropStage: 'Flowering',
    weather: {
      temperature: 28,
      humidity: 70,
      rainProbability: 30,
      rainfall: 0,
      windSpeed: 12,
      condition: 'Partly Cloudy'
    },
    soil: {
      type: 'Sandy Loam',
      ph: '6.5',
      moisture: 'Medium',
      irrigation: 'Drip'
    },
    diseaseAnalysis: {
      disease: 'Early Blight',
      isHealthy: false,
      severity: 'Moderate',
      confidence: 0.8
    }
  });

  console.log('SUCCESS!');
  console.log('threeDayRisk:', result.threeDayRisk);
  console.log('sevenDayRisk:', result.sevenDayRisk);
  console.log('riskFactors count:', result.riskFactors?.length);
  console.log('recommendations count:', result.recommendations?.length);
  console.log('disclaimer:', result.disclaimer);
} catch (err) {
  console.error('[RISK FORECAST ERROR]');
  console.error('HTTP status:', err.status);
  console.error('Error code:', err.code);
  console.error('Message:', err.message);
}
