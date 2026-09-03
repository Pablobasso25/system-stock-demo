import mongoose from 'mongoose';
import { tenantPlugin } from '../../plugins/tenantPlugin.js';

const cashWithdrawalSchema = new mongoose.Schema(
  {
    monto: {
      type: Number,
      required: true,
      min: 0.01,
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
  { timestamps: true }
);

cashWithdrawalSchema.index({ createdAt: -1 });

cashWithdrawalSchema.plugin(tenantPlugin);

export default mongoose.model('CashWithdrawal', cashWithdrawalSchema);