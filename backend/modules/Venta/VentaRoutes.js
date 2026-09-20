import { Router } from 'express';
import { crearVenta, eliminarVenta, obtenerVentas, obtenerEstadisticasVentas, obtenerMasVendidos, abrirCaja, obtenerCajaAbierta, cerrarCaja, reabrirCaja, obtenerCierresCaja, eliminarCierreCaja, reenviarMailCierre, probarCorreo, estadoCorreo, ejecutarMigracion, migrarTickets } from './VentaController.js';
import { proteger, admin, blockDemo } from '../../middlewares/AutenticacionMiddleware.js';

const router = Router();

router.use(proteger);

router.post('/caja/abrir', abrirCaja);
router.get('/caja/abierta', obtenerCajaAbierta);
router.post('/caja/cerrar', cerrarCaja);
router.post('/caja/reabrir', admin, reabrirCaja);
router.get('/cierres-caja', obtenerCierresCaja);
router.delete('/cierres-caja/:id', admin, eliminarCierreCaja);
router.post('/cierres-caja/:id/reenviar-mail', admin, blockDemo, reenviarMailCierre);
router.get('/stats', obtenerEstadisticasVentas);
router.get('/mas-vendidos', obtenerMasVendidos);
router.get('/', obtenerVentas);
if (process.env.NODE_ENV !== 'production') {
  router.post('/probar-correo', admin, blockDemo, probarCorreo);
  router.get('/estado-correo', admin, blockDemo, estadoCorreo);
  router.post('/migrar', admin, blockDemo, ejecutarMigracion);
  router.post('/migrar-tickets', admin, blockDemo, migrarTickets);
}
router.post('/', crearVenta);
router.delete('/:id', admin, eliminarVenta);

export default router;
