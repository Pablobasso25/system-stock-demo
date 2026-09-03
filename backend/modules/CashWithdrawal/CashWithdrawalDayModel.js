import mongoose from 'mongoose';
import { tenantPlugin } from '../../plugins/tenantPlugin.js';

const cashWithdrawalDaySchema = new mongoose.Schema({
  fecha: {
    type: String,
    required: true,
  },
  retirado: {
    type: Number,
    default: 0,
  },
});

cashWithdrawalDaySchema.index({ fecha: 1, tenantId: 1 }, { unique: true });

cashWithdrawalDaySchema.plugin(tenantPlugin);

export default mongoose.model('CashWithdrawalDay', cashWithdrawalDaySchema);