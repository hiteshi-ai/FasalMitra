/**
 * Expert Service for FasalMitra AI
 * 
 * Interacts with the backend consultation queue:
 * - Submitting farmer escalation requests when AI confidence is low or farmer requests review
 * - Fetching active requests
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const expertService = {
  submitConsultation: async (consultationData) => {
    const response = await fetch(`${BACKEND_URL}/api/expert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consultationData)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Failed to submit consultation request (status ${response.status})`);
    }

    return data;
  },

  getConsultationRequests: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/expert`);
      if (response.ok) {
        const data = await response.json();
        return data.cases || [];
      }
    } catch (err) {
      console.warn('expertService: Failed to fetch consultation queue:', err.message);
    }
    return [];
  },

  updateConsultation: async (id, updateData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/expert/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Failed to update consultation case (status ${response.status})`);
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error(`Cannot reach backend server at ${BACKEND_URL}. Please ensure the backend is running.`);
      }
      throw err;
    }
  }
};

export default expertService;
