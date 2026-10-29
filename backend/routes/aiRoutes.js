import { Router } from 'express';
import multer from 'multer';
import {
  predictDisease,
  riskForecast,
  ragAdvisory,
  expertConsultation,
  getExpertConsultations,
  updateExpertConsultation
} from '../controllers/aiController.js';

const router = Router();

// Configure multer memory storage (limit 10 MB per file)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed.'));
    }
  }
});

// AI Endpoints
router.post('/predict-disease', upload.single('image'), predictDisease);
router.post('/risk-forecast', riskForecast);
router.post('/rag', ragAdvisory);
router.post('/expert', expertConsultation);
router.get('/expert', getExpertConsultations);
router.patch('/expert/:id', updateExpertConsultation);
router.put('/expert/:id', updateExpertConsultation);

export default router;
