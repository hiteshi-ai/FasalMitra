// Full simulation of what happens during a real Farmer Portal run
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Step 1: Simulate disease analysis result (as if Gemini just returned it)
const diagnosisResult = {
  success: true,
  crop: 'Tomato',
  disease: 'Early Blight',
  isHealthy: false,
  confidence: 0.82,
  severity: 'Moderate',
  symptoms: ['Brown spots with yellow halos', 'Lower leaf damage'],
  possibleCauses: ['Alternaria solani fungus', 'High humidity'],
  recommendations: ['Remove infected leaves', 'Apply fungicide'],
  explanation: 'Tomato early blight detected with moderate severity.',
  needsExpertReview: false
};

// Step 2: Simulate what FarmerPortal.jsx builds for the risk forecast payload
const farmerCrop = { name: 'Tomato', category: 'Vegetable', hindiName: 'टमाटर' };
const farmerWeather = {
  temperature: 28,
  humidity: 72,
  rainProbability: 35,
  rainfall: 0.0,
  windSpeed: 14,
  condition: 'Partly Cloudy',
  timestamp: new Date().toISOString(),
  latitude: 30.9,
  longitude: 75.8,
  location: 'Test Farm',
  isDevelopmentData: true,
  dataSource: 'Development data — live weather unavailable'
};
const farmerSoil = { type: 'Alluvial / Loamy', ph: 'Normal / Fertile (~6.5 - 7.5)', moisture: 'Adequate Moisture', irrigation: 'Drip / Sprinkler' };
const farmerCropStage = 'Flowering';

// This is exactly what FarmerPortal.jsx sends:
const payload = {
  crop: diagnosisResult.crop || farmerCrop.name,
  cropStage: farmerCropStage || '',
  weather: farmerWeather || {},
  soil: farmerSoil || {},
  diseaseAnalysis: diagnosisResult
};

console.log('=== SIMULATED PAYLOAD ===');
console.log(JSON.stringify(payload, null, 2));

// Step 3: Test the HTTP endpoint with this exact payload
console.log('\n=== TESTING HTTP ENDPOINT ===');
try {
  const response = await fetch('http://localhost:5000/api/risk-forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  console.log('Response status:', response.status, response.statusText);
  console.log('Response ok:', response.ok);
  
  const data = await response.json().catch(err => {
    console.error('JSON parse error:', err.message);
    return null;
  });
  
  if (!response.ok) {
    console.error('ERROR RESPONSE:', data);
  } else {
    console.log('SUCCESS! threeDayRisk:', data?.threeDayRisk);
    console.log('sevenDayRisk:', data?.sevenDayRisk);
    console.log('riskFactors:', data?.riskFactors?.length, 'items');
    console.log('recommendations:', data?.recommendations?.length, 'items');
    console.log('disclaimer:', data?.disclaimer);
  }
} catch (err) {
  console.error('FETCH ERROR:', err.message);
}
