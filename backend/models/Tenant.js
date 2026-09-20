import mongoose from 'mongoose';
import { DEMO_DURACION_SEGUNDOS } from '../config/demo.js';

const tenantSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  isDemo: {
    type: Boolean,
    default: true,
  },
  vendedores: {
    type: [String],
    default: [],
  },
  ultimoAcceso: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tenantSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: DEMO_DURACION_SEGUNDOS,
    partialFilterExpression: { isDemo: true },
  }
);

export default mongoose.model('Tenant', tenantSchema);