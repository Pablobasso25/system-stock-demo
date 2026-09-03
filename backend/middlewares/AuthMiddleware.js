import { tenantContext as protect } from './TenantMiddleware.js';

export { protect };

export const admin = (req, res, next) => {
  if (req.user && (req.user.rol === 'admin' || req.user.rol === 'demo_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado, se requiere rol de administrador' });
  }
};

export const blockDemo = (req, res, next) => {
  if (req.user && req.user.rol === 'demo_admin') {
    return res.status(403).json({ message: 'Acción no disponible en modo demostración' });
  }
  next();
};