import { Router } from 'express';
import { isSupabaseReady } from '../services/supabaseClient.js';

const router = Router();

router.get('/health', (req, res) => {
  const supabaseOk = isSupabaseReady();
  const geminiKeyOk = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
    process.env.GEMINI_API_KEY.trim() !== ''
  );

  res.status(200).json({
    status: 'ok',
    service: 'FasalMitra API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    diagnostics: {
      supabase: supabaseOk ? 'connected' : 'not configured — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Render',
      gemini: geminiKeyOk ? 'key present' : 'missing — check GEMINI_API_KEY on Render',
      port: process.env.PORT || '5000 (default)',
      frontendOrigin: process.env.FRONTEND_URL || 'http://localhost:5173 (default)'
    }
  });
});

export default router;
