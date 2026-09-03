import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();

export const runWithTenant = (tenantId, fn) => {
  return storage.run({ tenantId }, fn);
};

export const getTenantContext = () => storage.getStore() || null;