import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'FasalMitra API',
    version: '1.0.0',
    phase: 'Phase 3 Foundation',
    timestamp: new Date().toISOString()
  });
});

export default router;
