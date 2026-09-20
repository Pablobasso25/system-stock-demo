import mongoose from 'mongoose';
import logger from '../utils/LoggerUtils.js';

export const COLECCIONES_HUERFANOS = [
  'productos',
  'ventas',
  'devoluciones',
  'proveedores',
  'notificaciones',
  'movimientosStock',
  'retirosCaja',
  'retirosCajaDias',
  'cierresCaja',
  'suscripcionesPush',
];

export const limpiarHuerfanos = async ({ apply = true } = {}) => {
  const db = mongoose.connection.db;
  if (!db) return [];

  const tenants = await db.collection('tenants').find({}, { projection: { _id: 1 } }).toArray();
  const idsVigentes = tenants.map((t) => t._id);
  const filtro = { tenantId: { $exists: true, $ne: null, $nin: idsVigentes } };

  const resultado = [];
  for (const nombre of COLECCIONES_HUERFANOS) {
    if (!apply) {
      const cantidad = await db.collection(nombre).countDocuments(filtro);
      if (cantidad > 0) resultado.push({ coleccion: nombre, cantidad });
      continue;
    }
    const borrados = await db.collection(nombre).deleteMany(filtro);
    if (borrados.deletedCount > 0) resultado.push({ coleccion: nombre, cantidad: borrados.deletedCount });
  }

  if (apply) {
    const total = resultado.reduce((suma, r) => suma + r.cantidad, 0);
    if (total > 0) {
      logger.info('Datos huérfanos de demos expiradas eliminados', {
        documentos: total,
        detalle: resultado.map((r) => `${r.coleccion}: ${r.cantidad}`).join(', '),
        origen: 'backend',
        lugar: 'limpiezaHuerfanos',
      });
    }
  }

  return resultado;
};
