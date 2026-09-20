import mongoose from 'mongoose';
import '../config/env.js';

const APPLY = process.argv.includes('--apply');

const COLECCIONES = [
  ['users', 'usuarios'],
  ['products', 'productos'],
  ['sales', 'ventas'],
  ['returns', 'devoluciones'],
  ['suppliers', 'proveedores'],
  ['notifications', 'notificaciones'],
  ['pushsubscriptions', 'suscripcionesPush'],
  ['cashwithdrawals', 'retirosCaja'],
  ['cashwithdrawaldays', 'retirosCajaDias'],
  ['dailycloses', 'cierresCaja'],
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  console.log(APPLY ? 'MODO APPLY: se renombrarán las colecciones' : 'MODO DRY-RUN: no se modifica nada');

  const existentes = new Set((await db.listCollections().toArray()).map((c) => c.name));

  let total = 0;
  for (const [origen, destino] of COLECCIONES) {
    if (!existentes.has(origen)) continue;
    if (existentes.has(destino)) {
      console.log(`[omitida] ${origen} -> ${destino}: la colección destino ya existe`);
      continue;
    }
    if (!APPLY) {
      console.log(`[pendiente] renombrar ${origen} -> ${destino}`);
      total += 1;
      continue;
    }
    await db.renameCollection(origen, destino);
    console.log(`[renombrada] ${origen} -> ${destino}`);
    total += 1;
  }

  console.log(`\nResumen: ${total} colección(es) ${APPLY ? 'renombradas' : 'pendientes'}.`);
  if (!APPLY) console.log('Dry-run finalizado. Para aplicar: node scripts/migrar-colecciones.js --apply');
};

run()
  .catch((error) => {
    console.error('Error al renombrar colecciones:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
