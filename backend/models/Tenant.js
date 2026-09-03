import mongoose from 'mongoose';

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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tenantSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 604800,
    partialFilterExpression: { isDemo: true },
  }
);

export default mongoose.model('Tenant', tenantSchema);