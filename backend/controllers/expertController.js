/**
 * Expert Consultation Controller for FasalMitra AI
 * 
 * Manages agricultural specialist consultations and case triage.
 * Persists data permanently to Supabase PostgreSQL (with in-memory fallback).
 */

import { databaseService } from '../services/databaseService.js';

// Retain export of in-memory list for backward compatibility
export const consultationRequests = [
  {
    id: 'FM-EXP-101',
    farmerName: 'Gurpreet Singh',
    crop: 'Wheat',
    cropStage: 'Vegetative',
    location: 'Ludhiana, Punjab',
    weather: {
      temperature: 22,
      humidity: 82,
      rainProbability: 60,
      rainfall: 3.5,
      windSpeed: 14,
      condition: 'Overcast'
    },
    soil: {
      type: 'Alluvial Loam',
      ph: '7.1',
      moisture: 'Adequate',
      irrigation: 'Canal Irrigated'
    },
    image: {
      url: '/assets/hero.png',
      name: 'wheat_leaf_sample.jpg',
      size: 1048576
    },
    diseaseAnalysis: {
      crop: 'Wheat',
      disease: 'Yellow Rust (Stripe Rust)',
      isHealthy: false,
      confidence: 0.88,
      severity: 'Moderate',
      symptoms: [
        'Linear yellow-orange pustules aligned along leaf veins',
        'Chlorotic striping on upper foliage'
      ],
      possibleCauses: [
        'Puccinia striiformis fungal spore infection',
        'Extended leaf wetness with cool day temperatures'
      ],
      recommendations: [
        'Inspect surrounding fields for stripe orientation.',
        'Avoid excessive late-season nitrogen applications.'
      ],
      explanation: 'Characteristic stripe rust pustules forming parallel rows between leaf veins under favorable microclimate.',
      needsExpertReview: true
    },
    riskForecast: {
      threeDayRisk: {
        level: 'Moderate',
        probability: 0.45,
        explanation: 'Incubation conditions favorable due to morning dew and 82% humidity.'
      },
      sevenDayRisk: {
        level: 'High',
        probability: 0.72,
        explanation: 'Overcast forecast and persistent moisture increase spore sporulation.'
      },
      riskLevel: 'Moderate',
      risk: { next3Days: 0.45, next7Days: 0.72 },
      factors: [
        'Relative humidity of 82% provides requisite leaf wetness',
        'Temperature of 22°C sits within favorable germination range'
      ],
      recommendations: [
        'Monitor canopy density in canal-fed strips.',
        'Prepare propiconazole or tebuconazole spray if pustules advance to flag leaf.'
      ],
      disclaimer: 'AI-assisted disease risk estimate; not a guaranteed prediction.'
    },
    farmerNotes: 'Noticed yellow lines spreading on wheat leaves after last week rains. Please advise.',
    question: 'Noticed yellow lines spreading on wheat leaves after last week rains. Please advise.',
    status: 'Pending',
    expertNotes: '',
    expertAssessment: '',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

/**
 * POST /api/expert
 * Creates an expert consultation case persisted to Supabase.
 */
export async function createExpertConsultation(req, res, next) {
  try {
    const {
      farmerId,
      farmerName,
      crop,
      cropStage,
      location,
      weather,
      soil,
      image,
      diseaseAnalysis,
      imageAnalysis,
      riskForecast,
      farmerNotes,
      question,
      status,
      expertNotes,
      expertAssessment
    } = req.body || {};

    const effectiveCrop = crop || diseaseAnalysis?.crop || imageAnalysis?.crop;
    if (!effectiveCrop && !diseaseAnalysis && !imageAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Crop details or image diagnosis must be provided to request expert consultation.'
      });
    }

    const caseId = `FM-EXP-${Date.now().toString().slice(-6)}`;
    const newCase = {
      id: caseId,
      farmerId: farmerId || null,
      farmerName: farmerName || 'Anonymous Farmer',
      crop: effectiveCrop || 'Crop',
      cropStage: cropStage || '',
      location: typeof location === 'string' ? location : (location?.name || 'Not specified'),
      weather: weather || null,
      soil: soil || null,
      image: image ? {
        url: image.url || image.dataUrl || (typeof image === 'string' ? image : null),
        dataUrl: image.dataUrl || image.url || (typeof image === 'string' ? image : null),
        name: image.name || 'crop_leaf.jpg',
        size: image.size || 0,
        type: image.type || 'image/jpeg'
      } : null,
      diseaseAnalysis: diseaseAnalysis || imageAnalysis || null,
      imageAnalysis: imageAnalysis || diseaseAnalysis || null,
      riskForecast: riskForecast || null,
      farmerNotes: farmerNotes || question || '',
      question: question || farmerNotes || 'Farmer requested specialist review of plant symptoms.',
      status: status || 'Pending',
      expertNotes: expertNotes || '',
      expertAssessment: expertAssessment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Supabase (with in-memory fallback)
    const savedCase = await databaseService.createConsultation(newCase);

    return res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully. An agricultural specialist will review your case.',
      consultation: savedCase
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/expert
 * View active consultation requests from Supabase (or in-memory fallback).
 */
export async function getExpertConsultations(req, res, next) {
  try {
    const cases = await databaseService.getConsultations();
    return res.status(200).json({
      success: true,
      total: cases.length,
      cases
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/expert/:id or PUT /api/expert/:id
 * Updates an expert consultation case (notes, assessment, status) permanently in Supabase.
 */
export async function updateExpertConsultation(req, res, next) {
  try {
    const { id } = req.params;
    const { expertNotes, expertAssessment, status } = req.body || {};

    const updatedCase = await databaseService.updateConsultation(id, {
      expertNotes,
      expertAssessment,
      status
    });

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: `Expert consultation case "${id}" was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expert review saved successfully.',
      consultation: updatedCase
    });
  } catch (error) {
    next(error);
  }
}
