import jwt from 'jsonwebtoken';
import Usuario from '../modules/Autenticacion/UsuarioModel.js';
import Tenant from '../models/Tenant.js';
import { runWithTenant } from '../services/tenantScope.js';
import { ensureMasterTenant } from '../services/tenantService.js';

export const proteger = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }

  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'No autorizado, token inválido' });
  }

  const rol = decoded.rol || decoded.role;

  if (rol === 'demo_admin') {
    if (!decoded.tenantId) {
      return res.status(403).json({ message: 'No autorizado, el token no pertenece a un tenant' });
    }
    try {
      const tenant = await Tenant.findById(decoded.tenantId);
      if (!tenant) {
        return res.status(401).json({ message: 'Sesión de demostración expirada' });
      }
      req.tenantId = tenant._id;
      req.usuario = {
        id: null,
        nombre: tenant.clientName,
        email: tenant.email || '',
        rol: 'demo_admin',
        tenantId: tenant._id,
      };
      return runWithTenant(req.tenantId, () => next());
    } catch (error) {
      return next(error);
    }
  }

  if (!decoded.id) {
    return res.status(401).json({ message: 'No autorizado, token inválido' });
  }

  try {
    const usuario = await Usuario.findById(decoded.id).select('nombre email rol versionToken tenantId');
    if (!usuario) {
      return res.status(401).json({ message: 'Sesión inválida, usuario no encontrado' });
    }
    if ((usuario.versionToken || 0) !== (decoded.versionToken || 0)) {
      return res.status(401).json({ message: 'Sesión expirada, vuelva a iniciar sesión' });
    }

    if (!usuario.tenantId) {
      const master = await ensureMasterTenant();
      usuario.tenantId = master._id;
      await usuario.save();
    }

    req.tenantId = String(usuario.tenantId);
    req.usuario = {
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      tenantId: usuario.tenantId,
    };
    return runWithTenant(req.tenantId, () => next());
  } catch (error) {
    next(error);
  }
};

export const admin = (req, res, next) => {
  if (req.usuario && (req.usuario.rol === 'admin' || req.usuario.rol === 'demo_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado, se requiere rol de administrador' });
  }
};

export const blockDemo = (req, res, next) => {
  if (req.usuario && req.usuario.rol === 'demo_admin') {
    return res.status(403).json({ message: 'Acción no disponible en modo demostración' });
  }
  next();
};
