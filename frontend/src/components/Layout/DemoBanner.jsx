import { useAuth } from '../../context/AuthContext';

const DemoBanner = () => {
  const { user } = useAuth();

  if (!user || (user.rol !== 'demo_admin' && user.role !== 'demo_admin')) return null;

  return (
    <div className="bg-ios-yellow/10 border-b border-ios-yellow/20 px-4 py-1.5 text-center shrink-0">
      <p className="text-[12px] font-medium text-ios-yellow">
        Modo Demostración activo - Los datos se restablecen automáticamente
      </p>
    </div>
  );
};

export default DemoBanner;