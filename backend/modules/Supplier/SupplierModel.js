import mongoose from 'mongoose';
import { tenantPlugin } from '../../plugins/tenantPlugin.js';

const supplierSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    direccion: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

supplierSchema.index({ nombre: 1, tenantId: 1 }, { unique: true });

supplierSchema.plugin(tenantPlugin);

export default mongoose.model('Supplier', supplierSchema);
