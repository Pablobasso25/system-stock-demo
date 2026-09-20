import { useState } from 'react';
import { useAutenticacion } from '../../context/AutenticacionContext';
import { switchDemoRole } from '../../api/demo';
import { setItem } from '../../utils/storage';
import IosModal from '../ui/IosModal';
import { IosField, IosInput } from '../ui/IosForm';

const DemoBanner = () => {
  const { usuario, actualizarUsuario } = useAutenticacion();
  const [modalOpen, setModalOpen] = useState(false);
  const [vendedor, setVendedor] = useState('');
  const [error, setError] = useState('');
  const [cambiando, setCambiando] = useState(false);

  if (!usuario?.esDemo) return null;

  const esAdmin = usuario.rolDemo === 'demo_admin';
  const tienda = usuario.clientName || usuario.nombre;

  const aplicarRol = async ({ rol, nombre }) => {
    setCambiando(true);
    setError('');
    try {
      const res = await switchDemoRole({ rol, nombre });
      setItem('token', res.data.token);
      actualizarUsuario(res.data.perfil);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la cuenta');
      return false;
    } finally {
      setCambiando(false);
    }
  };

  const entrarVendedor = async () => {
    const nombre = vendedor.trim();
    if (!nombre) {
      setError('Ingresá el nombre del vendedor');
      return;
    }
    const ok = await aplicarRol({ rol: 'demo_empleado', nombre });
    if (ok) {
      setModalOpen(false);
      setVendedor('');
    }
  };

  return (
    <>
      <div className="bg-ios-yellow/10 border-b border-ios-yellow/20 px-4 py-1.5 shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <p className="text-[12px] font-medium text-ios-yellow">
            Demo de {tienda} · {esAdmin ? 'Viendo como Administrador' : `Vendedor: ${usuario.nombre}`}
          </p>
          <button
            type="button"
            onClick={
              esAdmin
                ? () => {
                    setVendedor('');
                    setError('');
                    setModalOpen(true);
                  }
                : () => aplicarRol({ rol: 'demo_admin' })
            }
            disabled={cambiando}
            className="text-[11px] font-semibold text-ios-tint border border-ios-tint/40 rounded-ios-pill px-2.5 py-0.5 hover:bg-ios-tint/10 disabled:opacity-50 transition-colors"
          >
            {cambiando ? 'Cambiando...' : esAdmin ? 'Crear cuenta vendedor' : 'Volver a cuenta administrador'}
          </button>
        </div>
      </div>

      <IosModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear cuenta vendedor"
        confirmText="Entrar como vendedor"
        onConfirm={entrarVendedor}
        confirmDisabled={cambiando || !vendedor.trim()}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <IosField label="Nombre del vendedor" required>
            <IosInput
              type="text"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') entrarVendedor();
              }}
              maxLength={40}
              placeholder="Ej: Juan Pérez"
              autoFocus
            />
          </IosField>

          {usuario.vendedores?.length > 0 && (
            <div>
              <p className="text-[12px] text-ios-secondary font-medium mb-1.5">Vendedores creados</p>
              <div className="flex flex-wrap gap-2">
                {usuario.vendedores.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVendedor(n)}
                    className="text-[12px] font-medium text-ios-tint border border-ios-tint/30 rounded-ios-pill px-2.5 py-1 hover:bg-ios-tint/10 transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-[12px] text-ios-red font-medium">{error}</p>}

          <p className="text-[11px] text-ios-tertiary">
            Vas a entrar con esta cuenta de vendedor. Sus ventas y datos quedan dentro de la demo de {tienda}.
          </p>
        </div>
      </IosModal>
    </>
  );
};

export default DemoBanner;
