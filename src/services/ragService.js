/**
 * RAG / Agricultural Assistant Service for FasalMitra AI
 * 
 * Interacts with backend agricultural advisory Q&A powered by Gemini.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const ragService = {
  queryAdvisory: async (question, crop = '') => {
    if (!question || !question.trim()) {
      throw new Error('Please enter a question for the agricultural assistant.');
    }

    const response = await fetch(`${BACKEND_URL}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, crop })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data?.message || 'Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.');
      }
      throw new Error(data?.message || `Advisory query failed with status ${response.status}`);
    }

    return data;
  }
};

export default ragService;
