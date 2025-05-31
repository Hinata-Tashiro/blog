import { create } from 'zustand';
import { auth } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (username: string, password: string) => {
    try {
      const response = await auth.login(username, password);
      const { access_token } = response;
      
      localStorage.setItem('token', access_token);
      
      // Get user info
      const user = await auth.me();
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await auth.logout();
    } catch (error) {
      // Ignore error
    } finally {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      return;
    }
    
    try {
      const user = await auth.me();
      set({
        token,
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },
}));