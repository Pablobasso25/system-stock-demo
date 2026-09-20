import './config/env.js';
import app from './app.js';
import logger from './utils/LoggerUtils.js';
import { describirError } from './utils/MensajesErrorUtils.js';
import { asegurarInicio, limpiarSiCorresponde } from './bootstrap.js';

const PORT = process.env.PORT || 5000;

let cerrando = false;

const cerrarConError = (mensaje, error) => {
  if (cerrando) return;
  cerrando = true;
  const d = describirError(error);
  logger.error(mensaje, {
    motivo: d.titulo,
    detalle: d.detalle,
    queRevisar: d.queRevisar,
    origen: 'backend',
    stack: error?.stack,
  });
  logger.on('finish', () => process.exit(1));
  logger.end();
  setTimeout(() => process.exit(1), 2000).unref();
};

process.on('unhandledRejection', (reason) => {
  cerrarConError('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

process.on('uncaughtException', (error) => {
  cerrarConError('Uncaught exception', error);
});

asegurarInicio()
  .then(() => {
    const intervaloLimpieza = setInterval(limpiarSiCorresponde, 60 * 60 * 1000);
    intervaloLimpieza.unref();

    const server = app.listen(PORT, () => {
      logger.info('Servidor corriendo', {
        puerto: PORT,
        entorno: process.env.NODE_ENV || 'development',
        nivelDeDetalle: logger.level,
      });
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error('El puerto ya está en uso', {
          puerto: PORT,
          queRevisar: 'Cerrá el proceso que usa ese puerto o definí otro PORT en el .env.',
          origen: 'backend',
        });
      } else {
        const d = describirError(error);
        logger.error('Error del servidor', {
          motivo: d.titulo,
          detalle: d.detalle,
          queRevisar: d.queRevisar,
          origen: 'backend',
          stack: error.stack,
        });
      }
      process.exit(1);
    });
  })
  .catch(() => {
    process.exit(1);
  });
