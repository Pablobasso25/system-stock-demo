import '../config/env.js';
import { connectDB } from '../config/db.js';
import User from '../modules/Auth/AuthModel.js';
import Product from '../modules/Product/ProductModel.js';
import Sale from '../modules/Sale/SaleModel.js';
import Return from '../modules/Return/ReturnModel.js';
import Supplier from '../modules/Supplier/SupplierModel.js';
import Notification from '../modules/Notification/NotificationModel.js';
import CashWithdrawal from '../modules/CashWithdrawal/CashWithdrawalModel.js';
import CashWithdrawalDay from '../modules/CashWithdrawal/CashWithdrawalDayModel.js';
import DailyClose from '../modules/Sale/DailyCloseModel.js';
import PushSubscription from '../modules/Push/PushModel.js';
import { ensureMasterTenant } from '../services/tenantService.js';

const MODELS = [
  Product,
  Sale,
  Return,
  Supplier,
  Notification,
  CashWithdrawal,
  CashWithdrawalDay,
  DailyClose,
  PushSubscription,
];

const LEGACY_UNIQUE_INDEXES = [
  ['Sale', 'ticketNumero_1'],
  ['Supplier', 'nombre_1'],
  ['DailyClose', 'fecha_1_turno_1'],
  ['CashWithdrawalDay', 'fecha_1'],
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

  const users = await User.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: master._id } }
  );
  total += users.modifiedCount;
  console.log(`User: ${users.modifiedCount} documentos asignados al tenant maestro`);

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

  for (const Model of [...MODELS, User]) {
    await Model.syncIndexes();
  }
  console.log('Índices sincronizados (compuestos por tenantId)');

  console.log(`Migración completada. Total de documentos asignados: ${total}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('FATAL: La migración falló:', error.message);
  process.exit(1);
});