import { Router } from 'express';
import {
  registerFarmer,
  loginFarmer,
  getFarmerAccounts
} from '../controllers/authController.js';

const router = Router();

router.post('/auth/farmer/register', registerFarmer);
router.post('/auth/farmer/login', loginFarmer);
router.get('/auth/farmer/accounts', getFarmerAccounts);

export default router;
