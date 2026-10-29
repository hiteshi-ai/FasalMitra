/**
 * Disease Service for FasalMitra AI
 * 
 * Interacts with the FasalMitra Backend Gateway to invoke:
 * - Gemini Multimodal Vision for plant leaf disease identification
 * - Climate-based 3–7 day microclimate disease risk forecasting
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const diseaseService = {
  /**
   * Uploads crop leaf image to /api/predict-disease for Gemini visual diagnosis
   * @param {File} imageFile - Browser File or Blob
   * @param {string} cropName - Crop name or hint
   */
  detectDiseaseFromImage: async (imageFile, cropName = '') => {
    if (!imageFile) {
      throw new Error('Please select an image file to analyze.');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    if (cropName) {
      formData.append('crop', cropName);
    }

    const response = await fetch(`${BACKEND_URL}/api/predict-disease`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data?.message || 'Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.');
      }
      throw new Error(data?.message || `Image analysis request failed with status ${response.status}`);
    }

    return data;
  },

  /**
   * Submits crop, microclimate weather, soil, and diagnosis to /api/risk-forecast
   * for Gemini 3–7 day disease risk calculation
   */
  predictDiseaseRisk: async (payload) => {
    const response = await fetch(`${BACKEND_URL}/api/risk-forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data?.message || 'Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.');
      }
      throw new Error(data?.message || `Risk forecast request failed with status ${response.status}`);
    }

    return data;
  }
};

export default diseaseService;
