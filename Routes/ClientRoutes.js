import express from 'express';
import { register, login,getActiveNutrition,getActivePlans,forgetPassword, resetPassword ,changePassword,logout,updateClientProfile,createMeeting,rescheduleMeeting,getUpcomingMeetingsForClient
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
router.post('/logout',clientAuthMiddleware,logout)

router.get('/active-plans', clientAuthMiddleware, getActivePlans);
router.get("/getActiveNutrition",clientAuthMiddleware,getActiveNutrition);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', resetPassword);
router.put('/changePassword',clientAuthMiddleware,changePassword)
router.put('/updateClientProfile',clientAuthMiddleware,updateClientProfile)
router.post('/createMeeting',clientAuthMiddleware,createMeeting)
router.post('/rescheduleMeeting',clientAuthMiddleware,rescheduleMeeting)
router.get('/getUpcomingMeetingsForClient',clientAuthMiddleware,getUpcomingMeetingsForClient)
export default router;