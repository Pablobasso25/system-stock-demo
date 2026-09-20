import { Router } from 'express';
import { obtenerDemos } from './MasterController.js';
import { proteger, adminReal } from '../../middlewares/AutenticacionMiddleware.js';

const router = Router();

router.get('/demos', proteger, adminReal, obtenerDemos);

export default router;
