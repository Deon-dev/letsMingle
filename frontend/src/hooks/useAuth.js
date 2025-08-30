import api from '../api/axios';
import useStore from '../store/useStore';

export default function useAuth() {
  const { user, accessToken, setUser, setAccessToken, clearAuth } = useStore();

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setUser(data.user, data.accessToken);
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      setUser(data.user, data.accessToken);
      return data.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const refresh = async () => {
    try {
      const { data } = await api.post('/api/auth/refresh');
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth(); // Clear invalid auth state
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuth();
    }
  };

  return { user, accessToken, login, register, refresh, logout };
}