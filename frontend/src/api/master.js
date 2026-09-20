import api from './axios';

export const obtenerDemos = () => api.get('/master/demos');
