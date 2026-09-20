import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../context/AutenticacionContext';
import { obtenerDemos } from '../../api/master';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { IconRefresh, IconLogout } from '../../components/ui/icons';

const formatearFecha = (valor) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const hace = (valor) => {
  if (!valor) return 'sin accesos';
  const min = Math.round((Date.now() - new Date(valor).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hs = Math.round(min / 60);
  if (hs < 24) return `hace ${hs} h`;
  return `hace ${Math.round(hs / 24)} días`;
};

const vence = (minutos) => {
  if (minutos <= 0) return 'expirada';
  if (minutos < 60) return `${minutos} min`;
  const hs = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (hs < 24) return `${hs} h ${resto} min`;
  return `${Math.floor(hs / 24)} días`;
};

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

const PanelMaster = () => {
  const { usuario, logout } = useAutenticacion();
  const navigate = useNavigate();
  const [demos, setDemos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const esMaster = usuario?.rol === 'admin' && !usuario?.esDemo;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await obtenerDemos();
      setDemos(res.data.demos || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el panel');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (esMaster) cargar();
    else setCargando(false);
  }, [esMaster, cargar]);

  if (!esMaster) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ios-bg px-6 text-center">
        <p className="text-ios-label font-semibold">Acceso restringido a la cuenta principal</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="mt-5 px-4 py-2 rounded-ios-pill bg-ios-tint text-white text-sm font-semibold"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  const conActividad = demos.filter((d) => d.ultimoAcceso).length;
  const totalVendido = demos.reduce((s, d) => s + Number(d.totalVendido || 0), 0);

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="sticky top-0 z-10 bg-ios-surface/80 backdrop-blur-2xl border-b border-ios-separator/40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ios-label tracking-tight">Panel master</h1>
          <p className="text-[12px] text-ios-tertiary">Clientes probando la demo</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            disabled={cargando}
            className="w-9 h-9 rounded-full bg-ios-surface2 border border-ios-separator/40 flex items-center justify-center text-ios-secondary hover:text-ios-label disabled:opacity-50 transition-colors"
            aria-label="Actualizar"
          >
            <IconRefresh className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
            className="w-9 h-9 rounded-full bg-ios-surface2 border border-ios-separator/40 flex items-center justify-center text-ios-red hover:bg-ios-red/10 transition-colors"
            aria-label="Cerrar sesión"
          >
            <IconLogout className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ios-surface border border-ios-separator/30 rounded-2xl p-4 text-center shadow-ios-card">
            <p className="text-[22px] font-bold text-ios-label">{demos.length}</p>
            <p className="text-[11px] text-ios-tertiary font-medium">Demos activas</p>
          </div>
          <div className="bg-ios-surface border border-ios-separator/30 rounded-2xl p-4 text-center shadow-ios-card">
            <p className="text-[22px] font-bold text-ios-label">{conActividad}</p>
            <p className="text-[11px] text-ios-tertiary font-medium">Con actividad</p>
          </div>
          <div className="bg-ios-surface border border-ios-separator/30 rounded-2xl p-4 text-center shadow-ios-card">
            <p className="text-[22px] font-bold text-ios-label">{money(totalVendido)}</p>
            <p className="text-[11px] text-ios-tertiary font-medium">Vendido en demos</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-ios-red/10 border border-ios-red/25 rounded-ios-control text-ios-red text-sm font-medium">
            {error}
          </div>
        )}

        {cargando ? (
          <LoadingSpinner />
        ) : demos.length === 0 ? (
          <div className="text-center py-16 text-ios-tertiary text-sm">
            No hay demos activas por ahora
          </div>
        ) : (
          <div className="space-y-3">
            {demos.map((d) => (
              <div key={d._id} className="bg-ios-surface border border-ios-separator/30 rounded-3xl p-4 shadow-ios-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ios-label truncate">{d.clientName}</p>
                    <p className="text-[11px] text-ios-tertiary font-mono">{d.slug}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-ios-tint bg-ios-tint/10 border border-ios-tint/25 rounded-ios-pill px-2 py-0.5 whitespace-nowrap">
                    vence en {vence(d.minutosRestantes)}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-ios-separator/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                  <div>
                    <span className="text-ios-tertiary">Creada</span>
                    <p className="text-ios-secondary">{formatearFecha(d.creadoEn)}</p>
                  </div>
                  <div>
                    <span className="text-ios-tertiary">Último acceso</span>
                    <p className="text-ios-secondary">{hace(d.ultimoAcceso)}</p>
                  </div>
                  <div>
                    <span className="text-ios-tertiary">Productos</span>
                    <p className="text-ios-secondary">{d.productos}</p>
                  </div>
                  <div>
                    <span className="text-ios-tertiary">Ventas</span>
                    <p className="text-ios-secondary">
                      {d.ventas} · {money(d.totalVendido)}
                    </p>
                  </div>
                </div>

                {d.vendedores?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.vendedores.map((v) => (
                      <span
                        key={v}
                        className="text-[11px] text-ios-secondary bg-ios-surface2 border border-ios-separator/40 rounded-ios-pill px-2 py-0.5"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PanelMaster;
