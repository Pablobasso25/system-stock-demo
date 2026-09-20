import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();

let defaultTenantId = null;

export const runWithTenant = (tenantId, fn) => {
  return storage.run({ tenantId }, fn);
};

export const getTenantContext = () => storage.getStore() || null;

export const setDefaultTenantId = (tenantId) => {
  defaultTenantId = tenantId || null;
};

export const getDefaultTenantId = () => defaultTenantId;