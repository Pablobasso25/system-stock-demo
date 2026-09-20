import mongoose from 'mongoose';
import '../config/env.js';

const APPLY = process.argv.includes('--apply');

const COLECCIONES_LEGACY = [
  'users',
  'products',
  'sales',
  'returns',
  'suppliers',
  'notifications',
  'pushsubscriptions',
  'cashwithdrawals',
  'cashwithdrawaldays',
  'dailycloses',
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  console.log(APPLY ? 'MODO APPLY: se borrarán las colecciones legacy' : 'MODO DRY-RUN: no se modifica nada');

  const existentes = new Set((await db.listCollections().toArray()).map((c) => c.name));

  let total = 0;
  for (const nombre of COLECCIONES_LEGACY) {
    if (!existentes.has(nombre)) continue;
    const cantidad = await db.collection(nombre).countDocuments();
    if (!APPLY) {
      console.log(`[pendiente] borrar ${nombre} (${cantidad} documento(s))`);
      total += 1;
      continue;
    }
    await db.collection(nombre).drop();
    console.log(`[borrada] ${nombre} (${cantidad} documento(s))`);
    total += 1;
  }

  console.log(`\nResumen: ${total} colección(es) legacy ${APPLY ? 'borradas' : 'pendientes'}.`);
  if (!APPLY) console.log('Dry-run finalizado. Para aplicar: node scripts/borrar-colecciones-legacy.js --apply');
};

run()
  .catch((error) => {
    console.error('Error al borrar colecciones legacy:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
