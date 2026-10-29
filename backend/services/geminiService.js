import { GoogleGenAI } from '@google/genai';

/**
 * ============================================================================
 * FasalMitra AI - Gemini Multimodal Service
 * ============================================================================
 * Model identifier constant - easily configurable for future model releases.
 */
// Primary model: gemini-3.5-flash (stable, broadly available).
// Set GEMINI_MODEL in your Render environment variables to override.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

/**
 * Validate that a real API key is present in environment.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'PASTE_MY_KEY_HERE' || apiKey.trim() === '') {
    const error = new Error('Gemini API key is not configured. Please paste your valid key in backend/.env under GEMINI_API_KEY.');
    error.status = 401;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Executes a Gemini API call with safe retry and active model fallback for 503 / 404 errors.
 */
async function generateContentWithRetry(ai, requestOptions, maxRetries = 2, delayMs = 1500) {
  // Ordered candidate list: most reliable first, latest model last.
  // gemini-3.5-flash is broadly available and fast.
  // gemini-3.8-flash is newer but can be unavailable under high demand.
  const candidateModels = [
    requestOptions.model || GEMINI_MODEL,
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

  let lastError = null;

  for (const modelToTry of candidateModels) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await ai.models.generateContent({
          ...requestOptions,
          model: modelToTry
        });
      } catch (error) {
        attempt++;
        lastError = error;

        const isUnavailable =
          error.status === 503 ||
          error.code === 503 ||
          error.code === 'UNAVAILABLE' ||
          (typeof error.message === 'string' && (
            error.message.includes('high demand') ||
            error.message.includes('temporarily unavailable') ||
            error.message.includes('503')
          ));

        const isModelNotFound =
          error.status === 404 ||
          error.code === 404 ||
          error.code === 'NOT_FOUND' ||
          (typeof error.message === 'string' && error.message.includes('no longer available'));

        if (isModelNotFound) {
          // Immediately try next candidate model
          break;
        }

        if (isUnavailable && attempt <= maxRetries) {
          console.warn(`[Gemini Retry] Attempt ${attempt}/${maxRetries} on model "${modelToTry}". Retrying in ${delayMs * attempt}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
          continue;
        }

        // Move to next candidate model if 503 persists
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Safely extract text from a Gemini response object.
 * Falls back to candidates[0].content.parts[0].text if response.text is undefined
 * (which happens when Gemini returns empty parts or a safety-blocked response).
 */
function extractResponseText(response) {
  // Primary: SDK-level text getter
  const sdkText = response?.text;
  if (sdkText && typeof sdkText === 'string' && sdkText.trim()) {
    return sdkText;
  }
  // Fallback: dig into candidates directly (handles SDK returning undefined)
  const partText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (partText && typeof partText === 'string' && partText.trim()) {
    return partText;
  }
  return null;
}

/**
 * Cleanly extracts and parses JSON from Gemini output
 */
function parseGeminiJson(rawText) {
  if (!rawText) throw new Error('Received empty response from Gemini AI.');

  // Remove markdown code fences if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[Gemini JSON Parse Error]:', err.message, 'Raw Output:', rawText);
    throw new Error('Could not parse structured response from Gemini AI.');
  }
}

/**
 * 1. Image Quality Check & Crop Disease Analysis
 * Uses Gemini Multimodal Vision to inspect leaf/plant foliage.
 */
export async function analyzeCropDisease(imageBuffer, mimeType, cropHint = '') {
  const ai = getGeminiClient();

  const promptText = `You are a certified agricultural plant pathologist and crop disease specialist assisting Indian farmers.
Analyze this uploaded crop image carefully.

Farmer Crop Selection / Hint: ${cropHint || 'Not specified'}

STEP 1: IMAGE SUITABILITY & QUALITY CHECK
Evaluate if the image is suitable for agronomic analysis:
- Is the image too blurry, dark, or out of focus to observe leaf veins, spots, or discoloration?
- Is a plant, crop leaf, stem, or fruit clearly visible?
- Is the image completely unrelated to agriculture/plants (e.g. random object, animal, vehicle)?

If the image is unsuitable, blurry, or not a crop/plant:
Return a response asking the farmer to upload a clearer, well-lit photo of the affected plant foliage. Set:
- crop: "Unknown"
- disease: "Uncertain"
- isHealthy: false
- confidence: 0.2
- severity: "Unknown"
- symptoms: []
- possibleCauses: []
- recommendations: ["Please take a clear close-up photo of the affected leaf in daylight.", "Ensure the camera is focused on the discolored spots or damage.", "Consider expert verification if symptoms are hard to photograph."]
- explanation: "The uploaded image is insufficient, too blurry, or not clearly showing crop foliage for reliable diagnosis."
- needsExpertReview: true

STEP 2: PLANT HEALTH & DISEASE IDENTIFICATION (If image is suitable)
- Identify the crop/plant (match the farmer hint if visually consistent).
- Check if the plant is healthy:
  * If healthy: disease should be "Healthy", isHealthy: true, severity: "None", confidence between 0.85-0.98.
  * If diseased: identify the specific disease name (e.g. "Early Blight", "Yellow Rust", "Bacterial Blight", "Powdery Mildew").
- Estimate severity level: choose exactly one of ["None", "Low", "Moderate", "High", "Severe", "Unknown"].
- Estimate AI confidence: decimal between 0.0 and 1.0 based on visual clarity and symptom distinctness.
- List visible symptoms observed on the foliage.
- List possible causes (e.g., fungal spore infection, high humidity, insect vector, nutrient deficiency).
- Provide 3-4 actionable, farmer-friendly recommendations (cultural practices, removing infected foliage, irrigation management).
- Provide a concise explanation.
- Set needsExpertReview to true if confidence is below 0.65 or symptoms are ambiguous. NEVER invent or hallucinate a disease if uncertain.

OUTPUT FORMAT:
Return pure JSON matching this exact schema:
{
  "success": true,
  "crop": string,
  "disease": string,
  "isHealthy": boolean,
  "confidence": number,
  "severity": string,
  "symptoms": string[],
  "possibleCauses": string[],
  "recommendations": string[],
  "explanation": string,
  "needsExpertReview": boolean
}`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBuffer.toString('base64')
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const parsed = parseGeminiJson(response.text);
    return {
      success: true,
      crop: parsed.crop || cropHint || 'Unknown',
      disease: parsed.disease || 'Uncertain',
      isHealthy: Boolean(parsed.isHealthy),
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.5,
      severity: parsed.severity || 'Unknown',
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      explanation: parsed.explanation || 'Diagnosis completed.',
      needsExpertReview: Boolean(parsed.needsExpertReview)
    };
  } catch (error) {
    if (error.status === 401 || error.code === 'MISSING_API_KEY') throw error;
    console.error(`[Gemini Disease Analysis Error] HTTP ${error.status ?? 'N/A'}:`, error.message);
    if (error.status === 503 || error.code === 'UNAVAILABLE' || (error.message && error.message.includes('high demand'))) {
      const unavailableError = new Error('Gemini is temporarily unavailable. Please try the analysis again in a moment.');
      unavailableError.status = 503;
      unavailableError.code = 'GEMINI_UNAVAILABLE';
      throw unavailableError;
    }
    const err = new Error(`Gemini image analysis failed (HTTP ${error.status ?? 'unknown'}): ${error.message || 'Service unavailable'}`);
    err.status = error.status || 500;
    throw err;
  }
}

/**
 * 2. 3–7 Day Disease Risk Forecast
 * Correlates crop, microclimate weather, and soil data to estimate pathogen incubation window.
 */
export async function estimateDiseaseRisk({ crop, cropStage, weather, soil, diseaseAnalysis }) {
  const ai = getGeminiClient();

  const promptText = `You are an agricultural microclimate disease-risk estimation engine assisting Indian farmers.
Assess the 3-day and 7-day disease risk for the crop based on the supplied agronomic, microclimate, and disease inputs.
IMPORTANT PRINCIPLE: You are calculating an "AI-assisted disease risk estimate" based on epidemiological conditions (e.g. spore germination, leaf wetness hours, temperature thresholds, humidity, soil conditions). Do NOT claim guaranteed disease occurrences.

INPUT DATA:
- Crop: ${crop || 'Crop'}
- Growth Stage: ${cropStage || 'Not specified'}
- Microclimate Weather:
  * Temperature: ${weather?.temperature ?? '28'}°C
  * Relative Humidity: ${weather?.humidity ?? '70'}%
  * Rain Probability: ${weather?.rainProbability ?? '30'}%
  * Rainfall / Precipitation: ${weather?.rainfall ?? '0'} mm
  * Wind Speed: ${weather?.windSpeed ?? '12'} km/h
  * Current Condition: ${weather?.condition ?? 'Partly Cloudy'}
- Soil Profile:
  * Soil Type: ${soil?.type || 'Not specified'}
  * pH Level: ${soil?.ph || 'Not specified'}
  * Soil Moisture: ${soil?.moisture || 'Not specified'}
  * Irrigation Method: ${soil?.irrigation || 'Not specified'}
- Current Plant Status from Image Analysis:
  * Detected Condition/Disease: ${diseaseAnalysis?.disease || 'Not analyzed'}
  * Is Foliage Healthy: ${diseaseAnalysis?.isHealthy ?? false}
  * Visual Severity: ${diseaseAnalysis?.severity || 'Unknown'}
  * AI Visual Confidence: ${diseaseAnalysis?.confidence ?? 0.5}

TASK:
1. Estimate 3-Day Risk:
   - level: exactly one of ["Low", "Moderate", "High"]
   - probability: decimal between 0.05 and 0.95 (e.g. 0.35)
   - explanation: 1-2 concise sentences explaining microclimate incubation risk for the next 72 hours.
2. Estimate 7-Day Risk:
   - level: exactly one of ["Low", "Moderate", "High"]
   - probability: decimal between 0.05 and 0.95 (e.g. 0.55)
   - explanation: 1-2 concise sentences projecting pathogen spread or stabilization over the next week.
3. List 2-4 primary risk factors directly citing the provided weather (humidity, temperature, rain) and crop factors.
4. List 2-4 practical, farmer-friendly preventive recommendations to mitigate upcoming climate risk.
5. Include the mandatory scientific honesty disclaimer: "AI-assisted disease risk estimate; not a guaranteed prediction."

OUTPUT FORMAT:
Return pure JSON matching this exact schema:
{
  "threeDayRisk": {
    "level": "Low" | "Moderate" | "High",
    "probability": number,
    "explanation": string
  },
  "sevenDayRisk": {
    "level": "Low" | "Moderate" | "High",
    "probability": number,
    "explanation": string
  },
  "riskFactors": string[],
  "recommendations": string[],
  "disclaimer": "AI-assisted disease risk estimate; not a guaranteed prediction."
}`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    // Use safe text extractor — SDK response.text getter returns undefined when
    // Gemini returns empty parts (e.g. safety-blocked or model refusal response).
    const rawText = extractResponseText(response);

    if (!rawText) {
      // Gemini returned an empty/blocked response for the risk prompt.
      // Log for diagnosis and return a microclimate-based estimate using the
      // available weather + disease data so the UI is never left broken.
      const finishReason = response?.candidates?.[0]?.finishReason ?? 'UNKNOWN';
      console.warn(`[RISK FORECAST] Gemini returned empty response (finishReason: ${finishReason}) — computing microclimate fallback estimate.`);

      const humidity = weather?.humidity ?? 70;
      const temperature = weather?.temperature ?? 28;
      const rainProb = weather?.rainProbability ?? 30;
      const isAlreadyDisease = diseaseAnalysis?.isHealthy === false;
      const severity = diseaseAnalysis?.severity ?? 'Unknown';

      // Evidence-based microclimate probability estimate
      let baseProb3 = 0.30;
      let baseProb7 = 0.45;
      if (humidity > 75) { baseProb3 += 0.12; baseProb7 += 0.15; }
      if (temperature > 25 && temperature < 35) { baseProb3 += 0.10; baseProb7 += 0.12; }
      if (rainProb > 50) { baseProb3 += 0.08; baseProb7 += 0.10; }
      if (isAlreadyDisease) { baseProb3 += 0.15; baseProb7 += 0.18; }
      if (severity === 'High' || severity === 'Severe') { baseProb3 += 0.10; baseProb7 += 0.10; }

      const clamp = (v) => Math.min(Math.max(Math.round(v * 100) / 100, 0.05), 0.95);
      const p3 = clamp(baseProb3);
      const p7 = clamp(baseProb7);
      const lvl = (p) => p >= 0.65 ? 'High' : p >= 0.35 ? 'Moderate' : 'Low';

      const fallbackFactors = [
        `Relative humidity (${humidity}%) microclimate incubation condition`,
        `Temperature (${temperature}°C) influence on pathogen development cycle`
      ];
      if (isAlreadyDisease) {
        fallbackFactors.push(`Existing ${severity.toLowerCase()} plant condition increases secondary infection risk`);
      }

      return {
        success: true,
        threeDayRisk: {
          level: lvl(p3),
          probability: p3,
          explanation: `Microclimate estimate: ${humidity}% humidity and ${temperature}°C temperature are ${humidity > 75 ? 'elevated conditions favoring' : 'moderate conditions for'} pathogen incubation over the next 72 hours.`
        },
        sevenDayRisk: {
          level: lvl(p7),
          probability: p7,
          explanation: `7-day microclimate projection based on current ambient conditions (${temperature}°C / ${humidity}% RH) and ${rainProb}% precipitation probability.`
        },
        riskFactors: fallbackFactors,
        recommendations: [
          'Monitor crop canopy for early signs of lesion development, especially on lower leaves.',
          'Maintain good air circulation between plants to reduce localized humidity build-up.',
          'Apply preventive fungicide if humidity remains above 75% for consecutive days.',
          'Consider consulting local Krishi Vigyan Kendra (KVK) if symptoms worsen rapidly.'
        ],
        disclaimer: 'AI-assisted disease risk estimate; not a guaranteed prediction.',
        risk: { next3Days: p3, next7Days: p7 },
        riskLevel: lvl(p7),
        factors: fallbackFactors,
        explanation: `Microclimate-based risk estimate from ambient temperature (${temperature}°C) and relative humidity (${humidity}%).`
      };
    }

    const parsed = parseGeminiJson(rawText);

    // Normalize probabilities (handles 0.45 or 45)
    const normalizeProb = (val, fallback = 0.5) => {
      if (typeof val !== 'number' || isNaN(val)) return fallback;
      const num = val > 1 ? val / 100 : val;
      return Math.min(Math.max(num, 0.05), 0.95);
    };

    const threeDayProb = normalizeProb(
      parsed.threeDayRisk?.probability ?? parsed.risk?.next3Days,
      0.40
    );

    const sevenDayProb = normalizeProb(
      parsed.sevenDayRisk?.probability ?? parsed.risk?.next7Days,
      0.55
    );

    const normalizeLevel = (rawLevel, prob) => {
      if (typeof rawLevel === 'string') {
        const lower = rawLevel.toLowerCase();
        if (lower.includes('high') || lower.includes('severe') || lower.includes('critical')) return 'High';
        if (lower.includes('mod') || lower.includes('medium')) return 'Moderate';
        if (lower.includes('low')) return 'Low';
      }
      return prob >= 0.65 ? 'High' : prob >= 0.35 ? 'Moderate' : 'Low';
    };

    const threeDayLevel = normalizeLevel(parsed.threeDayRisk?.level, threeDayProb);
    const sevenDayLevel = normalizeLevel(parsed.sevenDayRisk?.level, sevenDayProb);

    const riskFactors = Array.isArray(parsed.riskFactors) && parsed.riskFactors.length > 0
      ? parsed.riskFactors
      : (Array.isArray(parsed.factors) && parsed.factors.length > 0 ? parsed.factors : [
          `Relative humidity (${weather?.humidity ?? 70}%) microclimate condition`,
          `Temperature (${weather?.temperature ?? 28}°C) impact on pathogen development`
        ]);

    const recommendations = Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
      ? parsed.recommendations
      : [
          'Monitor canopy leaf moisture closely during morning and evening hours.',
          'Ensure adequate plant spacing to facilitate air circulation and lower localized humidity.'
        ];

    const overallLevel = sevenDayProb >= 0.65 || threeDayProb >= 0.65 ? 'High' : (sevenDayProb >= 0.35 || threeDayProb >= 0.35 ? 'Moderate' : 'Low');

    const threeDayExp = parsed.threeDayRisk?.explanation || parsed.explanation || 'Short-term microclimate incubation estimate based on ambient temperature and moisture.';
    const sevenDayExp = parsed.sevenDayRisk?.explanation || parsed.explanation || 'Medium-term disease risk projection correlating weekly microclimate trends.';

    return {
      success: true,
      threeDayRisk: {
        level: threeDayLevel,
        probability: Math.round(threeDayProb * 100) / 100,
        explanation: threeDayExp
      },
      sevenDayRisk: {
        level: sevenDayLevel,
        probability: Math.round(sevenDayProb * 100) / 100,
        explanation: sevenDayExp
      },
      riskFactors,
      recommendations,
      disclaimer: 'AI-assisted disease risk estimate; not a guaranteed prediction.',
      // Backward compatibility fields:
      risk: {
        next3Days: Math.round(threeDayProb * 100) / 100,
        next7Days: Math.round(sevenDayProb * 100) / 100
      },
      riskLevel: overallLevel,
      factors: riskFactors,
      explanation: threeDayExp
    };
  } catch (error) {
    if (error.status === 401 || error.code === 'MISSING_API_KEY') throw error;
    console.error(`[RISK FORECAST ERROR] HTTP ${error.status ?? 'N/A'}: ${error.message}`);
    if (error.status === 503 || error.code === 'UNAVAILABLE' || (error.message && error.message.includes('high demand'))) {
      const unavailableError = new Error('Gemini is temporarily unavailable. Please try the analysis again in a moment.');
      unavailableError.status = 503;
      unavailableError.code = 'GEMINI_UNAVAILABLE';
      throw unavailableError;
    }
    const err = new Error(`Gemini risk forecast failed (HTTP ${error.status ?? 'unknown'}): ${error.message || 'Service unavailable'}`);
    err.status = error.status || 500;
    throw err;
  }
}

/**
 * 3. RAG / Agricultural Assistant Q&A
 * Answers farmer questions with safe agronomic guidance.
 */
export async function getAgriculturalGuidance(question, crop = '') {
  const ai = getGeminiClient();

  const promptText = `You are FasalMitra's AI Agricultural Advisory Assistant.
Answer the farmer's question with practical, reliable agronomic guidance.

Context:
- Crop of interest: ${crop || 'General agriculture'}
- Farmer Question: "${question}"

SAFETY & HONESTY RULES:
- Clearly label advice as AI agricultural guidance.
- Avoid dangerous certainty about synthetic pesticide or chemical dosages.
- Always recommend following the chemical container product label strictly and consulting local Krishi Vigyan Kendra (KVK) or state agricultural extension officers.
- Prioritize cultural, preventive, and integrated pest management (IPM) practices.

OUTPUT FORMAT:
Return pure JSON matching this exact schema:
{
  "success": true,
  "source": "AI agricultural guidance",
  "question": string,
  "crop": string,
  "answer": string,
  "actionSteps": string[],
  "safetyNote": "Always consult local certified agricultural extension officers and strictly follow pesticide container labels for dosage and safety guidelines."
}`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const parsed = parseGeminiJson(response.text);
    return {
      success: true,
      source: 'AI agricultural guidance',
      question: question,
      crop: crop || 'General',
      answer: parsed.answer || 'Consult your local agricultural extension service for specific recommendations.',
      actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
      safetyNote: 'Always consult local certified agricultural extension officers and strictly follow pesticide container labels for dosage and safety guidelines.'
    };
  } catch (error) {
    if (error.status === 401 || error.code === 'MISSING_API_KEY') throw error;
    console.error(`[Gemini RAG Assistant Error] HTTP ${error.status ?? 'N/A'}:`, error.message);
    if (error.status === 503 || error.code === 'UNAVAILABLE' || (error.message && error.message.includes('high demand'))) {
      const unavailableError = new Error('Gemini is temporarily unavailable. Please try the analysis again in a moment.');
      unavailableError.status = 503;
      unavailableError.code = 'GEMINI_UNAVAILABLE';
      throw unavailableError;
    }
    const err = new Error(`Gemini agricultural advisory failed (HTTP ${error.status ?? 'unknown'}): ${error.message || 'Service unavailable'}`);
    err.status = error.status || 500;
    throw err;
  }
}
