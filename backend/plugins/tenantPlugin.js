import mongoose from 'mongoose';
import { getTenantContext } from '../services/tenantScope.js';

const getScopeTenantId = () => {
  const ctx = getTenantContext();
  return ctx?.tenantId || null;
};

const appendTenantFilter = (query) => {
  const optionTenantId = query.getOptions?.().tenantId;
  const tenantId = optionTenantId || getScopeTenantId();
  if (!tenantId) return;
  if (!query.getFilter().tenantId) {
    query.where('tenantId').equals(tenantId);
  }
};

export const tenantPlugin = (schema) => {
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
  });

  schema.pre('validate', function (next) {
    if (!this.tenantId) {
      const optionTenantId = this.getOptions?.().tenantId;
      const tenantId = optionTenantId || getScopeTenantId();
      if (tenantId) this.tenantId = tenantId;
    }
    next();
  });

  schema.pre('insertMany', function (next, docs) {
    const tenantId = getScopeTenantId();
    if (!tenantId) return next();
    for (const doc of docs) {
      if (!doc.tenantId) doc.tenantId = tenantId;
    }
    next();
  });

  schema.pre(/^find/, function (next) {
    appendTenantFilter(this);
    next();
  });

  schema.pre('countDocuments', function (next) {
    appendTenantFilter(this);
    next();
  });

  schema.pre('distinct', function (next) {
    appendTenantFilter(this);
    next();
  });

  schema.pre('updateOne', function (next) {
    appendTenantFilter(this);
    next();
  });

  schema.pre('updateMany', function (next) {
    appendTenantFilter(this);
    next();
  });

  schema.pre('deleteOne', function (next) {
    appendTenantFilter(this);
    next();
  });

  schema.pre('deleteMany', function (next) {
    appendTenantFilter(this);
    next();
  });
};