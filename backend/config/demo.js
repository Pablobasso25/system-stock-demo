const minutosConfigurados = Number(process.env.DEMO_DURACION_MINUTOS);
const minutos = Number.isFinite(minutosConfigurados) && minutosConfigurados > 0 ? minutosConfigurados : 10080;

export const DEMO_DURACION_MINUTOS = minutos;
export const DEMO_DURACION_SEGUNDOS = Math.round(minutos * 60);
export const DEMO_TOKEN_TTL = `${minutos}m`;
export const DEMO_TTL_MS = DEMO_DURACION_SEGUNDOS * 1000;
