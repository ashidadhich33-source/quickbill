import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const result = await window.electronAPI.login(credentials);
          
          if (result.success && result.user && result.session) {
            set({
              user: result.user,
              session: result.session,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true, user: result.user };
          } else {
            set({ isLoading: false });
            return { success: false, error: result.error };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        }
      },

      logout: async () => {
        const { session } = get();
        if (session) {
          try {
            await window.electronAPI.logout(session.session_token);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      validateSession: async () => {
        const { session } = get();
        if (!session) {
          return false;
        }

        try {
          const result = await window.electronAPI.validateSession(session.session_token);
          
          if (result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true
            });
            return true;
          } else {
            // Session is invalid, clear auth state
            set({
              user: null,
              session: null,
              isAuthenticated: false
            });
            return false;
          }
        } catch (error) {
          console.error('Session validation error:', error);
          set({
            user: null,
            session: null,
            isAuthenticated: false
          });
          return false;
        }
      },

      checkAuth: async () => {
        const { validateSession } = get();
        await validateSession();
      }
    }),
    {
      name: 'quickbill-auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);