import mongoose from 'mongoose';
import '../config/env.js';

const APPLY = process.argv.includes('--apply');

const COLECCIONES = [
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

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  console.log(APPLY ? 'MODO APPLY: se eliminarán los datos huérfanos' : 'MODO DRY-RUN: no se modifica nada');

  const tenants = await db.collection('tenants').find({}, { projection: { _id: 1 } }).toArray();
  const idsVigentes = tenants.map((t) => t._id);
  console.log(`Tenants vigentes: ${idsVigentes.length}`);

  let total = 0;
  let sinTenant = 0;

  for (const nombre of COLECCIONES) {
    const huerfanos = { tenantId: { $exists: true, $ne: null, $nin: idsVigentes } };
    const cantidad = await db.collection(nombre).countDocuments(huerfanos);

    const faltantes = await db.collection(nombre).countDocuments({
      $or: [{ tenantId: { $exists: false } }, { tenantId: null }],
    });
    sinTenant += faltantes;
    if (faltantes > 0) {
      console.log(`[revisar] ${nombre}: ${faltantes} documento(s) sin tenantId (no se eliminan)`);
    }

    if (cantidad === 0) continue;

    if (!APPLY) {
      console.log(`[pendiente] ${nombre}: ${cantidad} documento(s) huérfano(s)`);
      total += cantidad;
      continue;
    }

    const resultado = await db.collection(nombre).deleteMany(huerfanos);
    total += resultado.deletedCount;
    console.log(`[limpiada] ${nombre}: ${resultado.deletedCount} documento(s) eliminado(s)`);
  }

  console.log(`\nResumen: ${total} documento(s) huérfano(s) ${APPLY ? 'eliminado(s)' : 'pendiente(s)'}.`);
  if (sinTenant > 0) console.log(`Documentos sin tenantId (no tocados): ${sinTenant}`);
  if (!APPLY) console.log('Dry-run finalizado. Para aplicar: node scripts/limpiar-huerfanos.js --apply');
};

run()
  .catch((error) => {
    console.error('Error al limpiar datos huérfanos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
