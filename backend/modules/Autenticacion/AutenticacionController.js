import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from './UsuarioModel.js';
import Tenant from '../../models/Tenant.js';
import { ROLES_DEMO } from '../Demo/demoRoles.js';
import { iniciarSesionSchema } from './AutenticacionSchema.js';
import { ensureMasterTenant } from '../../services/tenantService.js';

const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      tenantId: usuario.tenantId,
      versionToken: usuario.versionToken || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

export const iniciarSesion = async (req, res, next) => {
  try {
    const data = iniciarSesionSchema.parse(req.body);
    const email = data.email.trim().toLowerCase();

    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await usuario.comparePassword(data.clave))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!usuario.tenantId) {
      const master = await ensureMasterTenant();
      usuario.tenantId = master._id;
      await usuario.save();
    }

    const token = generarToken(usuario);

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerPerfil = async (req, res, next) => {
  try {
    if (ROLES_DEMO.includes(req.usuario.rol)) {
      const tenant = await Tenant.findByIdAndUpdate(
        req.usuario.tenantId,
        { $set: { ultimoAcceso: new Date() } },
        { new: true }
      );
      if (!tenant) {
        return res.status(404).json({ message: 'Sesión de demostración expirada' });
      }
      return res.json({
        _id: tenant._id,
        nombre: tenant.clientName,
        email: tenant.email || '',
        rol: req.usuario.rol,
        tenantId: tenant._id,
        slug: tenant.slug,
        isDemo: true,
      });
    }

    const usuario = await Usuario.findById(req.usuario.id).select('-clave');
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};