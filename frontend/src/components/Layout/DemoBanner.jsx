import { useState } from 'react';
import { useAutenticacion } from '../../context/AutenticacionContext';
import { switchDemoRole } from '../../api/demo';
import { setItem } from '../../utils/storage';

const DemoBanner = () => {
  const { usuario, refreshSession } = useAutenticacion();
  const [cambiando, setCambiando] = useState(false);

  if (!usuario?.esDemo) return null;

  const esAdmin = usuario.rolDemo === 'demo_admin';

  const cambiar = async () => {
    if (cambiando) return;
    setCambiando(true);
    try {
      const res = await switchDemoRole(esAdmin ? 'demo_empleado' : 'demo_admin');
      setItem('token', res.data.token);
      await refreshSession({ silent: true });
    } catch {
      /* se reintenta con el próximo click */
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div className="bg-ios-yellow/10 border-b border-ios-yellow/20 px-4 py-1.5 shrink-0">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <p className="text-[12px] font-medium text-ios-yellow">
          Modo Demostración · Viendo como {esAdmin ? 'Administrador' : 'Empleado'}
        </p>
        <button
          type="button"
          onClick={cambiar}
          disabled={cambiando}
          className="text-[11px] font-semibold text-ios-tint border border-ios-tint/40 rounded-ios-pill px-2.5 py-0.5 hover:bg-ios-tint/10 disabled:opacity-50 transition-colors"
        >
          {cambiando ? 'Cambiando...' : esAdmin ? 'Cambiar a cuenta empleado' : 'Volver a cuenta administrador'}
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
