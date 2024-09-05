import express from 'express';
import { register, login,createClient,createDietPlan,createProgramPlan,getTrainerDietPlans,
    getTrainerProgramPlans,
    getTrainerClients,getClientOverview,
    updateClientProfile,
    getTrainer,
    logout,
    forgetPassword,
    resetPassword,
    approveMeetingRequest,
    createMeetingRequest
} from '../Controllers/TrainerAuth.js';
import authMiddleware from '../Middlewares/authMiddleware.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/createClient',authMiddleware, createClient);
router.post('/createDietPlan', authMiddleware,createDietPlan);
router.post('/createProgramPlan',authMiddleware, createProgramPlan);
router.get('/getTrainerDietPlans',authMiddleware, getTrainerDietPlans);
router.get('/getTrainerProgramPlans',authMiddleware, getTrainerProgramPlans);
router.get('/getTrainerClients',authMiddleware, getTrainerClients);
router.get('/getClientOverview/:id',authMiddleware, getClientOverview);
router.put('/updateClientProfile',authMiddleware, updateClientProfile);
router.get('/getTrainer',authMiddleware, getTrainer);
router.get('/logout',authMiddleware, logout);
router.post('/forgetPassword', forgetPassword);
router.post('/resetPassword', resetPassword);
router.post('/approveMeetingRequest',authMiddleware, approveMeetingRequest);
router.post('/createMeetingRequest',authMiddleware, createMeetingRequest);
export default router;
