import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DemoAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('El enlace de demostración es inválido o está incompleto.');
      return;
    }

    let cancelled = false;
    localStorage.setItem('token', token);

    refreshSession()
      .then(() => {
        if (!cancelled) navigate('/', { replace: true });
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem('token');
        setError('El enlace de demostración es inválido o expiró. Generá una nueva sesión demo para continuar.');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, refreshSession]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ios-bg px-6 text-center">
        <p className="text-ios-label font-semibold">{error}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="mt-5 px-4 py-2 rounded-ios-pill bg-ios-tint text-white text-sm font-semibold"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-ios-bg">
      <LoadingSpinner size="h-10 w-10" />
      <p className="mt-4 text-sm text-ios-tertiary">Preparando la sesión de demostración...</p>
    </div>
  );
};

export default DemoAccess;