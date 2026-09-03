import jwt from 'jsonwebtoken';
import { runWithTenant } from '../services/tenantScope.js';

export const tenantContext = (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.toLowerCase().startsWith('bearer')) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'No autorizado, token inválido' });
  }

  if (!decoded.tenantId) {
    return res.status(403).json({ message: 'No autorizado, el token no pertenece a un tenant' });
  }

  req.tenantId = decoded.tenantId;
  req.user = { ...decoded, rol: decoded.rol || decoded.role };

  return runWithTenant(req.tenantId, () => next());
};

export const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Acceso denegado, contexto de tenant requerido' });
  }
  next();
};