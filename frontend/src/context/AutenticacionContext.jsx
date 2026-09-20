import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerPerfil } from '../api/autenticacion';
import { getItem, setItem, removeItem } from '../utils/storage';
import { useIosAlert } from '../components/alerts';

const AutenticacionContext = createContext();

export const useAutenticacion = () => useContext(AutenticacionContext);

const normalizarUsuario = (data) => {
  if (data?.rol === 'demo_admin') {
    return { ...data, rol: 'admin', rolDemo: 'demo_admin', esDemo: true };
  }
  if (data?.rol === 'demo_empleado') {
    return { ...data, rol: 'user', rolDemo: 'demo_empleado', esDemo: true };
  }
  return data;
};

export const AutenticacionProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useIosAlert();

  const usuarioRef = useRef(usuario);
  const avisoRef = useRef(0);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  const clearSession = useCallback(() => {
    removeItem('token');
    setUsuario(null);
  }, []);

  const refreshSession = useCallback((options = {}) => {
    const { silent = false } = options;
    const token = getItem('token');
    if (!token) {
      setUsuario(null);
      if (!silent) setLoading(false);
      return Promise.resolve();
    }
    if (!silent) setLoading(true);
    return obtenerPerfil()
      .then((res) => {
        const usuario = normalizarUsuario(res.data);
        setUsuario(usuario);
        return usuario;
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401 || status === 404) {
          clearSession();
        }
        throw err;
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [clearSession]);

  useEffect(() => {
    refreshSession().catch(() => {});
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      const habiaSesion = Boolean(usuarioRef.current);
      clearSession();
      if (!habiaSesion) return;
      const ahora = Date.now();
      if (ahora - avisoRef.current < 5000) return;
      avisoRef.current = ahora;
      toast({ message: 'Sesión expirada, iniciá sesión de nuevo', type: 'info', duration: 3200 });
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [clearSession, toast]);

  const login = useCallback((data) => {
    setItem('token', data.token);
    setUsuario(normalizarUsuario(data));
    navigate('/', { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({ usuario, loading, login, logout, refreshSession }), [usuario, loading, login, logout, refreshSession]);

  return (
    <AutenticacionContext.Provider value={value}>
      {children}
    </AutenticacionContext.Provider>
  );
};
