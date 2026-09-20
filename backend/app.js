import './config/env.js';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { contextoPeticion, registradorPeticiones } from './middlewares/RequestLogger.js';
import { manejadorErrores } from './middlewares/ErrorMiddleware.js';
import { asegurarInicio, limpiarSiCorresponde } from './bootstrap.js';
import AutenticacionRoutes from './modules/Autenticacion/AutenticacionRoutes.js';
import DemoRoutes from './modules/Demo/DemoRoutes.js';
import ProveedorRoutes from './modules/Proveedor/ProveedorRoutes.js';
import ProductoRoutes from './modules/Producto/ProductoRoutes.js';
import MovimientoStockRoutes from './modules/MovimientoStock/MovimientoStockRoutes.js';
import DevolucionRoutes from './modules/Devolucion/DevolucionRoutes.js';
import VentaRoutes from './modules/Venta/VentaRoutes.js';
import NotificacionRoutes from './modules/Notificacion/NotificacionRoutes.js';
import RetiroCajaRoutes from './modules/RetiroCaja/RetiroCajaRoutes.js';
import PushRoutes from './modules/Push/PushRoutes.js';
import ReporteErrorRoutes from './modules/ReporteError/ReporteErrorRoutes.js';
import MasterRoutes from './modules/Master/MasterRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

app.set('trust proxy', 1);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(contextoPeticion);
app.use(cors({ origin: allowedOrigins }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(registradorPeticiones);

app.use(async (req, res, next) => {
  try {
    await asegurarInicio();
    limpiarSiCorresponde();
    next();
  } catch (error) {
    next(error);
  }
});

const rateLimitBase = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
};

const authLimiter = rateLimit({
  ...rateLimitBase,
  limit: 30,
  message: { message: 'Demasiados intentos. Intente de nuevo en 15 minutos.' },
});

const globalLimiter = rateLimit({
  ...rateLimitBase,
  limit: 1500,
  message: { message: 'Demasiadas peticiones. Intente de nuevo en unos minutos.' },
});

const writeLimiter = rateLimit({
  ...rateLimitBase,
  limit: 300,
  message: { message: 'Demasiadas operaciones. Intente de nuevo en unos minutos.' },
});

const errorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados reportes de error. Intente más tarde.' },
});

const soloEscrituras = (limiter) => (req, res, next) =>
  req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' ? next() : limiter(req, res, next);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', globalLimiter);
app.use('/api', soloEscrituras(writeLimiter));
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', AutenticacionRoutes);
app.use('/api/demo', DemoRoutes);
app.use('/api/proveedores', ProveedorRoutes);
app.use('/api/productos', ProductoRoutes);
app.use('/api/movimientos-stock', MovimientoStockRoutes);
app.use('/api/devoluciones', DevolucionRoutes);
app.use('/api/ventas', VentaRoutes);
app.use('/api/notificaciones', NotificacionRoutes);
app.use('/api/retiros-caja', RetiroCajaRoutes);
app.use('/api/master', MasterRoutes);
app.use('/api/push', PushRoutes);
app.use('/api/errores', errorLimiter, ReporteErrorRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');

if (!isDev && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
      if (!error || res.headersSent) return;
      res.status(404).json({ message: 'Frontend no compilado' });
    });
  });
}

app.use(manejadorErrores);

export default app;
