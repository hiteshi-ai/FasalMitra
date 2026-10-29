import { Router } from 'express';
import {
  getExpertConsultations,
  createExpertConsultation,
  updateExpertConsultation
} from '../controllers/expertController.js';

const router = Router();

router.get('/expert', getExpertConsultations);
router.post('/expert', createExpertConsultation);
router.patch('/expert/:id', updateExpertConsultation);
router.put('/expert/:id', updateExpertConsultation);

export default router;
