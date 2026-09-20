import api from './axios';

export const createDemoSession = (data) => api.post('/demo/create-session', data);

export const enterDemoSession = (data) => api.post('/demo/enter', data);

export const switchDemoRole = (rol) => api.post('/demo/switch-role', { rol });
