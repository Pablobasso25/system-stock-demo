import '../config/env.js';
import { connectDB } from '../config/db.js';
import Usuario from '../modules/Autenticacion/UsuarioModel.js';
import Producto from '../modules/Producto/ProductoModel.js';
import Venta from '../modules/Venta/VentaModel.js';
import Devolucion from '../modules/Devolucion/DevolucionModel.js';
import Proveedor from '../modules/Proveedor/ProveedorModel.js';
import Notificacion from '../modules/Notificacion/NotificacionModel.js';
import MovimientoStock from '../modules/MovimientoStock/MovimientoStockModel.js';
import RetiroCaja from '../modules/RetiroCaja/RetiroCajaModel.js';
import RetiroCajaDia from '../modules/RetiroCaja/RetiroCajaDiaModel.js';
import CierreCaja from '../modules/Venta/CierreCajaModel.js';
import SuscripcionPush from '../modules/Push/PushModel.js';
import Tenant from '../models/Tenant.js';
import { ensureMasterTenant } from '../services/tenantService.js';

const MODELS = [
  Producto,
  Venta,
  Devolucion,
  Proveedor,
  Notificacion,
  MovimientoStock,
  RetiroCaja,
  RetiroCajaDia,
  CierreCaja,
  SuscripcionPush,
];

const LEGACY_UNIQUE_INDEXES = [
  ['Venta', 'ticketNumero_1'],
  ['Proveedor', 'nombre_1'],
  ['CierreCaja', 'fecha_1_turno_1'],
  ['RetiroCajaDia', 'fecha_1'],
];

const run = async () => {
  await connectDB();

  const master = await ensureMasterTenant();
  console.log(`Tenant maestro asegurado: ${master.slug} (${master._id})`);

  let total = 0;

  for (const Model of MODELS) {
    const result = await Model.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: master._id } }
    );
    total += result.modifiedCount;
    console.log(`${Model.modelName}: ${result.modifiedCount} documentos asignados al tenant maestro`);
  }

  const usuarios = await Usuario.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: master._id } }
  );
  total += usuarios.modifiedCount;
  console.log(`Usuario: ${usuarios.modifiedCount} documentos asignados al tenant maestro`);

  for (const [modelName, indexName] of LEGACY_UNIQUE_INDEXES) {
    const Model = MODELS.find((m) => m.modelName === modelName);
    try {
      await Model.collection.dropIndex(indexName);
      console.log(`Índice global ${indexName} eliminado (reemplazado por índice compuesto con tenantId)`);
    } catch (error) {
      if (error.codeName !== 'IndexNotFound') {
        console.warn(`No se pudo eliminar el índice ${indexName}: ${error.message}`);
      }
    }
  }

  for (const Model of [...MODELS, Usuario, Tenant]) {
    await Model.syncIndexes();
  }
  console.log('Índices sincronizados (compuestos por tenantId y TTL de demos)');

  console.log(`Migración completada. Total de documentos asignados: ${total}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('FATAL: La migración falló:', error.message);
  process.exit(1);
});
