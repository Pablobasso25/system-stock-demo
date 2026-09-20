import mongoose from 'mongoose';
import { campoCentavos } from '../../utils/DineroUtils.js';
import { tenantPlugin } from '../../plugins/tenantPlugin.js';

const cashWithdrawalSchema = new mongoose.Schema(
  {
    monto: {
      ...campoCentavos,
      required: true,
      min: 1,
    },
    motivo: {
      type: String,
      required: true,
      trim: true,
    },
    realizadoPor: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }, toJSON: { getters: true } }
);

cashWithdrawalSchema.index({ fechaCreacion: -1 });

cashWithdrawalSchema.plugin(tenantPlugin);

export default mongoose.model('RetiroCaja', cashWithdrawalSchema, 'retirosCaja');