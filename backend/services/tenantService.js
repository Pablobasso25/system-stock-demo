import Tenant from '../models/Tenant.js';

export const MASTER_TENANT_SLUG = 'master';

export const ensureMasterTenant = async () => {
  const existing = await Tenant.findOne({ slug: MASTER_TENANT_SLUG });
  if (existing) return existing;
  return Tenant.create({
    slug: MASTER_TENANT_SLUG,
    clientName: 'Cuenta principal',
    isDemo: false,
  });
};