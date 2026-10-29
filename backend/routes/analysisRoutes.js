import { Router } from 'express';
import {
  saveAnalysisRecord,
  getAnalysisRecords
} from '../controllers/analysisController.js';

const router = Router();

router.post('/analyses', saveAnalysisRecord);
router.get('/analyses', getAnalysisRecords);

export default router;
