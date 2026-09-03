import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './AuthModel.js';
import Tenant from '../../models/Tenant.js';
import { loginSchema } from './AuthSchema.js';
import { ensureMasterTenant } from '../../services/tenantService.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.tenantId) {
      const master = await ensureMasterTenant();
      user.tenantId = master._id;
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (req.user.rol === 'demo_admin') {
      const tenant = await Tenant.findById(req.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Sesión de demostración expirada' });
      }
      return res.json({
        id: tenant._id,
        nombre: tenant.clientName,
        email: tenant.email || '',
        rol: 'demo_admin',
        tenantId: tenant._id,
        slug: tenant.slug,
        isDemo: true,
      });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const seed = async (req, res, next) => {
  try {
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) {
      return res.json({ message: 'El usuario admin ya existe' });
    }

    const master = await ensureMasterTenant();

    await User.create({
      nombre: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      rol: 'admin',
      tenantId: master._id,
    });

    res.json({ message: 'Usuario admin creado correctamente' });
  } catch (error) {
    next(error);
  }
};