import {
  analyzeCropDisease,
  estimateDiseaseRisk,
  getAgriculturalGuidance
} from '../services/geminiService.js';

// In-memory consultations queue re-exported from expertController
export {
  consultationRequests,
  createExpertConsultation as expertConsultation,
  getExpertConsultations,
  updateExpertConsultation
} from './expertController.js';

/**
 * POST /api/predict-disease
 * Multipart form upload for crop leaf image disease identification.
 */
export async function predictDisease(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No crop image uploaded. Please provide an image file in JPG or PNG format.'
      });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Please upload a JPG or PNG image.'
      });
    }

    const cropHint = req.body?.crop || '';

    const diagnosis = await analyzeCropDisease(
      req.file.buffer,
      req.file.mimetype,
      cropHint
    );

    return res.status(200).json(diagnosis);
  } catch (error) {
    if (error.status === 401 || error.code === 'MISSING_API_KEY') {
      return res.status(401).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: error.message
      });
    }
    if (error.status === 503 || error.code === 'GEMINI_UNAVAILABLE' || error.code === 'UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        code: 'GEMINI_UNAVAILABLE',
        message: 'Gemini is temporarily unavailable. Please try the analysis again in a moment.'
      });
    }
    next(error);
  }
}

/**
 * POST /api/risk-forecast
 * Calculates 3-day and 7-day disease risk estimate based on crop, microclimate, and soil inputs.
 */
export async function riskForecast(req, res, next) {
  try {
    const { crop, cropStage, weather, soil, diseaseAnalysis } = req.body || {};

    if (!crop) {
      return res.status(400).json({
        success: false,
        message: 'Crop identification is required to estimate disease risk.'
      });
    }

    const forecast = await estimateDiseaseRisk({
      crop,
      cropStage,
      weather: weather || {},
      soil: soil || {},
      diseaseAnalysis: diseaseAnalysis || {}
    });

    return res.status(200).json(forecast);
  } catch (error) {
    if (error.status === 401 || error.code === 'MISSING_API_KEY') {
      return res.status(401).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: error.message
      });
    }
    if (error.status === 503 || error.code === 'GEMINI_UNAVAILABLE' || error.code === 'UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        code: 'GEMINI_UNAVAILABLE',
        message: 'Gemini is temporarily unavailable. Please try the analysis again in a moment.'
      });
    }
    next(error);
  }
}

/**
 * POST /api/rag
 * Agricultural advisory Q&A assistant.
 */
export async function ragAdvisory(req, res, next) {
  try {
    const { question, crop } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid question string is required.'
      });
    }

    const advice = await getAgriculturalGuidance(question.trim(), crop || '');
    return res.status(200).json(advice);
  } catch (error) {
    if (error.status === 401 || error.code === 'MISSING_API_KEY') {
      return res.status(401).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: error.message
      });
    }
    if (error.status === 503 || error.code === 'GEMINI_UNAVAILABLE' || error.code === 'UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        code: 'GEMINI_UNAVAILABLE',
        message: 'Gemini is temporarily unavailable. Please try the analysis again in a moment.'
      });
    }
    next(error);
  }
}
