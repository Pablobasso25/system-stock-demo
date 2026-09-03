import api from './axios';

export const createDemoSession = (data) => api.post('/demo/create-session', data);