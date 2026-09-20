import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createDemoSession, enterDemoSession, switchDemoRole } from './DemoController.js';
import { proteger } from '../../middlewares/AutenticacionMiddleware.js';

const demoSessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  message: { message: 'Demasiadas sesiones demo creadas. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const demoEnterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: { message: 'Demasiados ingresos a la demo. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/create-session', demoSessionLimiter, createDemoSession);
router.post('/enter', demoEnterLimiter, enterDemoSession);
router.post('/switch-role', proteger, switchDemoRole);

export default router;