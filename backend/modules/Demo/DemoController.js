import jwt from 'jsonwebtoken';
import Tenant from '../../models/Tenant.js';
import Producto from '../Producto/ProductoModel.js';
import { DEMO_PRODUCTS } from './demoCatalog.js';
import { ROLES_DEMO } from './demoRoles.js';

const DEMO_TOKEN_TTL = '7d';
const DEMO_TTL_MS = 604800 * 1000;

const generarSlug = () => `demo-${Math.floor(10000 + Math.random() * 90000)}`;

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizarNombre = (valor) => String(valor || '').trim().replace(/\s+/g, ' ').slice(0, 60);

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const sembrarCatalogo = async (tenantId) => {
  await Producto.insertMany(DEMO_PRODUCTS.map((p) => ({ ...p, tenantId })));
};

const buscarDemoActiva = (clientName) =>
  Tenant.findOne({
    isDemo: true,
    clientName: new RegExp(`^${escaparRegex(clientName)}$`, 'i'),
    createdAt: { $gte: new Date(Date.now() - DEMO_TTL_MS) },
  }).sort({ ultimoAcceso: -1, createdAt: -1 });

const firmarTokenDemo = (tenant, rol = 'demo_admin', nombre) =>
  jwt.sign(
    { tenantId: tenant._id, slug: tenant.slug, rol, ...(nombre ? { nombre } : {}) },
    process.env.JWT_SECRET,
    { expiresIn: DEMO_TOKEN_TTL }
  );

const respuestaDemo = (req, tenant, token, resumed) => {
  const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  return {
    token,
    slug: tenant.slug,
    clientName: tenant.clientName,
    resumed,
    accessUrl: `/demo-access?token=${token}`,
    fullUrl: `${origin}/demo-access?token=${token}`,
    expiresIn: 604800,
  };
};

export const createDemoSession = async (req, res, next) => {
  try {
    const clientName = normalizarNombre(req.body?.clientName) || 'Prospecto demo';
    const email = String(req.body?.email || '').trim().toLowerCase() || undefined;

    if (email && !validarEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const tenant = await crearTenantUnico(clientName, email);
    if (!tenant) {
      return res.status(500).json({ message: 'No se pudo generar la sesión, intente nuevamente' });
    }

    await sembrarCatalogo(tenant._id);

    const token = firmarTokenDemo(tenant);

    res.status(201).json(respuestaDemo(req, tenant, token, false));
  } catch (error) {
    next(error);
  }
};

export const enterDemoSession = async (req, res, next) => {
  try {
    const clientName = normalizarNombre(req.body?.clientName);
    if (!clientName) {
      return res.status(400).json({ message: 'Ingresá el nombre de tu local' });
    }

    let tenant = await buscarDemoActiva(clientName);
    const resumed = Boolean(tenant);

    if (tenant) {
      tenant.ultimoAcceso = new Date();
      await tenant.save();
    } else {
      tenant = await crearTenantUnico(clientName);
      if (!tenant) {
        return res.status(500).json({ message: 'No se pudo generar la sesión, intente nuevamente' });
      }
      await sembrarCatalogo(tenant._id);
    }

    const token = firmarTokenDemo(tenant);

    res.status(resumed ? 200 : 201).json(respuestaDemo(req, tenant, token, resumed));
  } catch (error) {
    next(error);
  }
};

export const switchDemoRole = async (req, res, next) => {
  try {
    if (!ROLES_DEMO.includes(req.usuario?.rol)) {
      return res.status(403).json({ message: 'Solo disponible en sesiones de demostración' });
    }

    const rol = String(req.body?.rol || '');
    if (!ROLES_DEMO.includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    let nombre = null;
    let tenant;
    if (rol === 'demo_empleado') {
      nombre = normalizarNombre(req.body?.nombre).slice(0, 40);
      if (!nombre) {
        return res.status(400).json({ message: 'Ingresá el nombre del vendedor' });
      }
      tenant = await Tenant.findByIdAndUpdate(
        req.tenantId,
        { $addToSet: { vendedores: nombre }, $set: { ultimoAcceso: new Date() } },
        { new: true }
      );
    } else {
      tenant = req.tenant;
    }

    if (!tenant) {
      return res.status(404).json({ message: 'Sesión de demostración expirada' });
    }

    const token = firmarTokenDemo(tenant, rol, nombre);

    res.json({
      token,
      perfil: {
        _id: tenant._id,
        nombre: nombre || tenant.clientName,
        clientName: tenant.clientName,
        email: tenant.email || '',
        rol,
        tenantId: tenant._id,
        slug: tenant.slug,
        isDemo: true,
        vendedores: tenant.vendedores || [],
      },
    });
  } catch (error) {
    next(error);
  }
};