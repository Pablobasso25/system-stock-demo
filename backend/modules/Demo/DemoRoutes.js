import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createDemoSession } from './DemoController.js';

const demoSessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { message: 'Demasiadas sesiones demo creadas. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/create-session', demoSessionLimiter, createDemoSession);

export default router;