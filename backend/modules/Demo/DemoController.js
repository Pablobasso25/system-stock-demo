import jwt from 'jsonwebtoken';
import Tenant from '../../models/Tenant.js';
import Product from '../Product/ProductModel.js';
import { DEMO_PRODUCTS } from './demoCatalog.js';

const DEMO_TOKEN_TTL = '7d';

const generarSlug = () => `demo-${Math.floor(10000 + Math.random() * 90000)}`;

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const crearTenantUnico = async (clientName, email) => {
  for (let intento = 0; intento < 5; intento++) {
    try {
      return await Tenant.create({
        slug: generarSlug(),
        clientName,
        email,
        isDemo: true,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  return null;
};

export const createDemoSession = async (req, res, next) => {
  try {
    const clientName = String(req.body?.clientName || '').trim() || 'Prospecto demo';
    const email = String(req.body?.email || '').trim().toLowerCase() || undefined;

    if (email && !validarEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const tenant = await crearTenantUnico(clientName, email);
    if (!tenant) {
      return res.status(500).json({ message: 'No se pudo generar la sesión, intente nuevamente' });
    }

    await Product.insertMany(
      DEMO_PRODUCTS.map((p) => ({ ...p, tenantId: tenant._id }))
    );

    const token = jwt.sign(
      { tenantId: tenant._id, slug: tenant.slug, role: 'demo_admin' },
      process.env.JWT_SECRET,
      { expiresIn: DEMO_TOKEN_TTL }
    );

    const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      token,
      slug: tenant.slug,
      clientName: tenant.clientName,
      accessUrl: `/demo-access?token=${token}`,
      fullUrl: `${origin}/demo-access?token=${token}`,
      expiresIn: 604800,
    });
  } catch (error) {
    next(error);
  }
};