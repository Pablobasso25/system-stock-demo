import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const refreshSession = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return getMe()
      .then((res) => setUser(res.data))
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401 || status === 404) {
          clearSession();
        }
        throw err;
      })
      .finally(() => setLoading(false));
  }, [clearSession]);

  useEffect(() => {
    refreshSession().catch(() => {});
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data);
    navigate('/', { replace: true });
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
