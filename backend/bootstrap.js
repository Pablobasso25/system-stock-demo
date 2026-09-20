import { connectDB } from './config/db.js';
import logger from './utils/LoggerUtils.js';
import { describirError } from './utils/MensajesErrorUtils.js';
import Usuario from './modules/Autenticacion/UsuarioModel.js';
import Venta from './modules/Venta/VentaModel.js';
import CierreCaja from './modules/Venta/CierreCajaModel.js';
import { asegurarNumerosTicket, migrarArticulosVenta } from './modules/Venta/VentaController.js';
import { ensureMasterTenant } from './services/tenantService.js';
import { limpiarHuerfanos } from './services/limpiezaHuerfanos.js';

const REQUERIDAS = [
  'MONGO_URI',
  'JWT_SECRET',
  'ALLOWED_ORIGINS',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'EMPLEADO_EMAIL',
  'EMPLEADO_PASSWORD',
];

const INTERVALO_LIMPIEZA_MS = 6 * 60 * 60 * 1000;

const validarEntorno = () => {
  const faltantes = REQUERIDAS.filter((clave) => !process.env[clave]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}. Copiá backend/.env.example y completá los valores.`);
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('cambia_esto')) {
    throw new Error('JWT_SECRET inválido: debe tener al menos 32 caracteres y no ser un valor de ejemplo.');
  }
  if (process.env.NODE_ENV === 'production') {
    const clavesEjemplo =
      process.env.ADMIN_PASSWORD === 'nexus2026' || process.env.EMPLEADO_PASSWORD === 'empleado123';
    if (clavesEjemplo) {
      throw new Error('Las contraseñas de ejemplo no se pueden usar en producción.');
    }
  }
};

const sembrarUsuario = async (nombre, email, clave, rol, tenantId) => {
  const emailNormalizado = String(email || '').trim().toLowerCase();
  const existe = await Usuario.exists({ email: emailNormalizado });
  if (existe) return;
  try {
    await Usuario.create({ nombre, email: emailNormalizado, clave, rol, tenantId });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

const sembrarUsuarios = async (masterTenantId) => {
  try {
    await sembrarUsuario('Admin', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, 'admin', masterTenantId);
    logger.debug('Usuario admin verificado');

    await sembrarUsuario('Empleado', process.env.EMPLEADO_EMAIL, process.env.EMPLEADO_PASSWORD, 'user', masterTenantId);
    logger.debug('Usuario empleado verificado');
  } catch (error) {
    const d = describirError(error);
    logger.error('No se pudieron crear los usuarios iniciales', {
      motivo: d.titulo,
      detalle: d.detalle,
      queRevisar: d.queRevisar || 'Revisá la conexión a la base de datos.',
      origen: 'backend',
      stack: error.stack,
    });
  }
};

let ultimaLimpieza = 0;

export const limpiarSiCorresponde = () => {
  if (Date.now() - ultimaLimpieza < INTERVALO_LIMPIEZA_MS) return;
  ultimaLimpieza = Date.now();
  limpiarHuerfanos().catch((error) => {
    logger.warn('No se pudieron limpiar los datos huérfanos', {
      motivo: error.message,
      origen: 'backend',
      lugar: 'limpiezaHuerfanos',
    });
  });
};

const iniciar = async () => {
  validarEntorno();
  await connectDB();

  const masterTenant = await ensureMasterTenant();
  await sembrarUsuarios(masterTenant._id);
  limpiarSiCorresponde();

  try {
    await Venta.init();
    await CierreCaja.init();
    const itemsMigrados = await migrarArticulosVenta();
    if (itemsMigrados > 0) logger.info(`Ventas legacy migradas al formato articulos[]: ${itemsMigrados}`);
    const migradas = await asegurarNumerosTicket();
    if (migradas > 0) logger.info(`Números de ticket asignados a ${migradas} ventas existentes`);
  } catch (error) {
    const d = describirError(error);
    logger.error('No se pudieron asignar los números de ticket pendientes', {
      motivo: d.titulo,
      detalle: d.detalle,
      queRevisar: d.queRevisar,
      origen: 'backend',
      stack: error.stack,
    });
  }
};

export const asegurarInicio = () => {
  if (!globalThis.__stockDemoInicio) {
    globalThis.__stockDemoInicio = iniciar().catch((error) => {
      globalThis.__stockDemoInicio = null;
      const d = describirError(error);
      logger.error('No se pudo iniciar el backend', {
        motivo: d.titulo,
        detalle: d.detalle,
        queRevisar: d.queRevisar || 'Verificá MONGO_URI, las variables de entorno y que la base esté disponible.',
        origen: 'backend',
        stack: error.stack,
      });
      throw error;
    });
  }
  return globalThis.__stockDemoInicio;
};
