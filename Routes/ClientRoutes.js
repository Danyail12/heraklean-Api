import express from 'express';
import { register, login,getActiveNutrition,getActivePlans,forgetPassword, resetPassword 
} from '../Controllers/Client.js';
import {clientAuthMiddleware} from '../Middlewares/authMiddleware.js';
const router = express.Router();



// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (example)
router.get('/profile', clientAuthMiddleware, (req, res) => {
  res.json(req.client);
});

router.get('/active-plans', clientAuthMiddleware, getActivePlans);
router.get("/getActiveNutrition",clientAuthMiddleware,getActiveNutrition);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', resetPassword);
export default router;