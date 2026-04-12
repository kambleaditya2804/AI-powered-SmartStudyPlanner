import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
    window.location.href = '/login';
  },
}));

export default useAuthStore;