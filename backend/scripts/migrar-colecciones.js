import mongoose from 'mongoose';
import '../config/env.js';
import { ensureMasterTenant } from '../services/tenantService.js';

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

  console.log(APPLY ? 'MODO APPLY: se migrarán las colecciones legacy' : 'MODO DRY-RUN: no se modifica nada');

  const existentes = new Set((await db.listCollections().toArray()).map((c) => c.name));

  let renombradas = 0;
  let copiados = 0;
  let omitidos = 0;

  for (const [origen, destino] of COLECCIONES) {
    if (!existentes.has(origen)) continue;

    if (!existentes.has(destino)) {
      if (!APPLY) {
        console.log(`[pendiente] renombrar ${origen} -> ${destino}`);
        renombradas += 1;
        continue;
      }
      await db.renameCollection(origen, destino);
      existentes.add(destino);
      renombradas += 1;
      console.log(`[renombrada] ${origen} -> ${destino}`);
      continue;
    }

    const docs = await db.collection(origen).find({}).toArray();
    if (docs.length === 0) {
      console.log(`[vacía] ${origen}: sin documentos para copiar a ${destino}`);
      continue;
    }

    if (!APPLY) {
      console.log(`[pendiente] copiar ${docs.length} documento(s) de ${origen} -> ${destino} (omitiendo existentes)`);
      copiados += docs.length;
      continue;
    }

    const master = await ensureMasterTenant();
    let copiadosCol = 0;
    let omitidosCol = 0;
    for (const doc of docs) {
      const yaExiste = await db.collection(destino).findOne({ _id: doc._id }, { projection: { _id: 1 } });
      if (yaExiste) {
        omitidosCol += 1;
        continue;
      }
      if (doc.email) {
        const mismoEmail = await db.collection(destino).findOne({ email: doc.email }, { projection: { _id: 1 } });
        if (mismoEmail) {
          omitidosCol += 1;
          continue;
        }
      }
      if (!doc.tenantId) doc.tenantId = master._id;
      try {
        await db.collection(destino).insertOne(doc);
        copiadosCol += 1;
      } catch (error) {
        if (error.code === 11000) {
          omitidosCol += 1;
          continue;
        }
        throw error;
      }
    }
    copiados += copiadosCol;
    omitidos += omitidosCol;
    console.log(`[copiada] ${origen} -> ${destino}: ${copiadosCol} copiado(s), ${omitidosCol} omitido(s)`);
  }

  console.log(`\nResumen: ${renombradas} renombrada(s), ${copiados} documento(s) ${APPLY ? 'copiado(s)' : 'pendiente(s)'}, ${omitidos} omitido(s).`);
  if (!APPLY) console.log('Dry-run finalizado. Para aplicar: node scripts/migrar-colecciones.js --apply');
};

run()
  .catch((error) => {
    console.error('Error al migrar colecciones legacy:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
