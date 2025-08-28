// import { useEffect } from 'react';
import api from '../api/axios';
import useStore from '../store/useStore';

export default function useAuth() {
  const { user, accessToken, setUser, setAccessToken } = useStore();

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data.user, data.accessToken);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    setUser(data.user, data.accessToken);
    return data.user;
  };

  const refresh = async () => {
    const { data } = await api.post('/api/auth/refresh');
    setAccessToken(data.accessToken);
    return data.accessToken;
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null, null);
  };

  // Refresh token every ~50m
  // useEffect(() => {
  //   const run = async () => {
  //     try {
  //       await refresh();
  //     } catch (err) {
  //       console.error("Refresh failed:", err.message);
  //     }
  //   };

  //   run();
  //   const id = setInterval(run, 50 * 60 * 1000);
  //   return () => clearInterval(id);
  // }, );

  return { user, accessToken, login, register, refresh, logout };
}

