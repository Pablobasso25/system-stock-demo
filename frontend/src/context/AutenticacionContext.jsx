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

const tokenEsDemo = () => {
  const token = getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.rol || '').startsWith('demo_');
  } catch {
    return false;
  }
};

export const AutenticacionProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoExpirada, setDemoExpirada] = useState(false);
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
          if (tokenEsDemo()) setDemoExpirada(true);
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
      const eraDemo = Boolean(usuarioRef.current?.esDemo);
      if (eraDemo || tokenEsDemo()) setDemoExpirada(true);
      clearSession();
      if (!habiaSesion) return;
      const ahora = Date.now();
      if (ahora - avisoRef.current < 5000) return;
      avisoRef.current = ahora;
      toast({
        message: eraDemo
          ? 'Tu tiempo de prueba expiró, creá una demo nueva'
          : 'Sesión expirada, iniciá sesión de nuevo',
        type: 'info',
        duration: 4000,
      });
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [clearSession, toast]);

  const login = useCallback((data) => {
    setItem('token', data.token);
    setUsuario(normalizarUsuario(data));
    navigate('/', { replace: true });
  }, [navigate]);

  const actualizarUsuario = useCallback((data) => {
    setUsuario(normalizarUsuario(data));
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const limpiarDemoExpirada = useCallback(() => {
    setDemoExpirada(false);
  }, []);

  const value = useMemo(
    () => ({ usuario, loading, login, logout, refreshSession, actualizarUsuario, demoExpirada, limpiarDemoExpirada }),
    [usuario, loading, login, logout, refreshSession, actualizarUsuario, demoExpirada, limpiarDemoExpirada]
  );

  return (
    <AutenticacionContext.Provider value={value}>
      {children}
    </AutenticacionContext.Provider>
  );
};
