import { databaseService } from '../services/databaseService.js';

/**
 * Farmer Analyses Controller
 * 
 * Manages persisting and retrieving complete plant disease analyses,
 * 3-7 day microclimate risk estimates, and farmer history in Supabase.
 */

export async function saveAnalysisRecord(req, res, next) {
  try {
    const analysisPayload = req.body || {};
    if (!analysisPayload.crop && !analysisPayload.diseaseAnalysis && !analysisPayload.diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Analysis data is required to save record.'
      });
    }

    const saved = await databaseService.saveAnalysis(analysisPayload);
    return res.status(201).json({
      success: true,
      message: 'Farmer crop analysis saved permanently.',
      analysis: saved
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalysisRecords(req, res, next) {
  try {
    const { farmerId } = req.query;
    const records = await databaseService.getAnalyses(farmerId || null);
    return res.status(200).json({
      success: true,
      total: records.length,
      analyses: records
    });
  } catch (error) {
    next(error);
  }
}
