/**
 * Analysis Persistence Service for FasalMitra AI
 * 
 * Manages persisting and retrieving farmer crop disease diagnoses,
 * 3-7 day microclimate risk estimates, and farmer history from Supabase.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const analysisService = {
  /**
   * Save an analysis record to the database
   */
  saveAnalysis: async (payload) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (response.ok) {
        return data?.analysis || payload;
      }
      console.warn('[analysisService] Server could not save analysis record:', data?.message);
    } catch (err) {
      console.warn('[analysisService] Network exception while saving analysis:', err.message);
    }
    return payload;
  },

  /**
   * Retrieve previous analysis records for the farmer
   */
  getAnalyses: async (farmerId = null) => {
    try {
      const queryParam = farmerId ? `?farmerId=${encodeURIComponent(farmerId)}` : '';
      const response = await fetch(`${BACKEND_URL}/api/analyses${queryParam}`);
      if (response.ok) {
        const data = await response.json().catch(() => null);
        return data?.analyses || [];
      }
    } catch (err) {
      console.warn('[analysisService] Failed to fetch farmer history:', err.message);
    }
    return [];
  }
};

export default analysisService;
