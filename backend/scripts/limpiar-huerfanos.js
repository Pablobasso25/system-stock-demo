import mongoose from 'mongoose';
import '../config/env.js';
import { limpiarHuerfanos, COLECCIONES_HUERFANOS } from '../services/limpiezaHuerfanos.js';

const APPLY = process.argv.includes('--apply');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  console.log(APPLY ? 'MODO APPLY: se eliminarán los datos huérfanos' : 'MODO DRY-RUN: no se modifica nada');

  const resultado = await limpiarHuerfanos({ apply: APPLY });

  let total = 0;
  for (const r of resultado) {
    console.log(`${APPLY ? '[limpiada]' : '[pendiente]'} ${r.coleccion}: ${r.cantidad} documento(s) huérfano(s)`);
    total += r.cantidad;
  }
  if (resultado.length === 0) console.log('No hay datos huérfanos.');

  let sinTenant = 0;
  for (const nombre of COLECCIONES_HUERFANOS) {
    const faltantes = await db.collection(nombre).countDocuments({
      $or: [{ tenantId: { $exists: false } }, { tenantId: null }],
    });
    sinTenant += faltantes;
  }
  if (sinTenant > 0) console.log(`[revisar] ${sinTenant} documento(s) sin tenantId (no se eliminan)`);

  console.log(`\nResumen: ${total} documento(s) huérfano(s) ${APPLY ? 'eliminado(s)' : 'pendiente(s)'}.`);
  if (!APPLY) console.log('Dry-run finalizado. Para aplicar: node scripts/limpiar-huerfanos.js --apply');
};

run()
  .catch((error) => {
    console.error('Error al limpiar datos huérfanos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
