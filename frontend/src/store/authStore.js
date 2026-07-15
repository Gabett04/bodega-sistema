import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({
        user: res.data.user,
        token: res.data.access_token,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.detail || 'Error al iniciar sesion',
        loading: false,
      });
      return false;
    }
  },

  registro: async (datos) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/registro', datos);
      set({ loading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.detail || 'Error al registrar',
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;