import Tenant from '../../models/Tenant.js';
import Producto from '../Producto/ProductoModel.js';
import Venta from '../Venta/VentaModel.js';
import { DEMO_DURACION_MINUTOS } from '../../config/demo.js';
import { deCentavos } from '../../utils/DineroUtils.js';

export const obtenerDemos = async (req, res, next) => {
  try {
    const desde = new Date(Date.now() - DEMO_DURACION_MINUTOS * 60 * 1000);
    const tenants = await Tenant.find({ isDemo: true, createdAt: { $gte: desde } })
      .sort({ ultimoAcceso: -1, createdAt: -1 })
      .lean();

    const ids = tenants.map((t) => t._id);

    const contar = async (Model, campos) => {
      const filas = await Model.aggregate([
        { $match: { tenantId: { $in: ids } } },
        { $group: { _id: '$tenantId', ...campos } },
      ]);
      return new Map(filas.map((f) => [String(f._id), f]));
    };

    const productos = await contar(Producto, { n: { $sum: 1 } });
    const ventas = await contar(Venta, { n: { $sum: 1 }, total: { $sum: '$total' } });

    const ahora = Date.now();
    const demos = tenants.map((t) => {
      const expira = new Date(t.createdAt).getTime() + DEMO_DURACION_MINUTOS * 60 * 1000;
      const venta = ventas.get(String(t._id));
      return {
        _id: t._id,
        clientName: t.clientName,
        slug: t.slug,
        email: t.email || '',
        creadoEn: t.createdAt,
        ultimoAcceso: t.ultimoAcceso || null,
        vendedores: t.vendedores || [],
        productos: productos.get(String(t._id))?.n || 0,
        ventas: venta?.n || 0,
        totalVendido: deCentavos(venta?.total || 0),
        minutosRestantes: Math.max(0, Math.round((expira - ahora) / 60000)),
      };
    });

    res.json({ demos, duracionMinutos: DEMO_DURACION_MINUTOS });
  } catch (error) {
    next(error);
  }
};
