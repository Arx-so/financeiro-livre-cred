import { create } from 'zustand';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole, Profile } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
  initialize: () => Promise<void>;

  // Internal actions
  _setUser: (user: AuthUser | null) => void;
  _setSession: (session: Session | null) => void;
  _setLoading: (loading: boolean) => void;
}

// Fetch user profile from database
const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error('Error fetching profile:', error);
            return null;
        }

        const profile = data as Profile;
        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            avatarUrl: profile.avatar_url,
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

// Helper function to translate Supabase auth errors to Portuguese
function translateAuthError(error: AuthError): string {
    const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'Email ou senha inválidos',
        'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
        'User already registered': 'Este email já está cadastrado',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'Unable to validate email address: invalid format': 'Formato de email inválido',
        'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
        'For security purposes, you can only request this after 60 seconds': 'Aguarde 60 segundos para tentar novamente.',
    };

    return errorMessages[error.message] || error.message;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isInitialized: false,

    _setUser: (user) => set({ user, isAuthenticated: !!user }),
    _setSession: (session) => set({ session }),
    _setLoading: (isLoading) => set({ isLoading }),

    initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        try {
            // Get initial session
            const { data: { session: initialSession } } = await supabase.auth.getSession();

            if (initialSession?.user) {
                set({ session: initialSession });

                const profile = await fetchUserProfile(initialSession.user.id);
                if (profile) {
                    set({ user: profile, isAuthenticated: true });
                }
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        } finally {
            set({ isLoading: false, isInitialized: true });
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, newSession) => {
            console.log('[Auth] onAuthStateChange event:', event);

            set({ session: newSession });

            // Only handle sign out here - sign in is handled by login()
            if (event === 'SIGNED_OUT') {
                console.log('[Auth] SIGNED_OUT - clearing user state');
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
                localStorage.removeItem('fincontrol_unidade');
            }
        });
    },

    login: async (email, password) => {
        try {
            console.log('[Auth] login() called');
            set({ isLoading: true });

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('[Auth] signInWithPassword result:', { user: data?.user?.id, error });

            if (error) {
                set({ isLoading: false });
                return { success: false, error: translateAuthError(error) };
            }

            if (!data.user) {
                set({ isLoading: false });
                return { success: false, error: 'Erro ao autenticar usuário' };
            }

            // Fetch profile directly in login() to ensure it completes before returning
            console.log('[Auth] Fetching profile...');
            const profile = await fetchUserProfile(data.user.id);
            console.log('[Auth] Profile result:', profile);

            if (!profile) {
                set({ isLoading: false });
                return { success: false, error: 'Perfil de usuário não encontrado. Entre em contato com o administrador.' };
            }

            set({
                user: profile,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
            });

            console.log('[Auth] Login complete');
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            set({ isLoading: false });
            return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
        }
    },

    register: async (email, password, name) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: 'usuario',
                    },
                },
            });

            if (error) {
                return { success: false, error: translateAuthError(error) };
            }

            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
        }
    },

    resetPassword: async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                return { success: false, error: translateAuthError(error) };
            }

            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: 'Erro ao enviar email de recuperação.' };
        }
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
            set({
                user: null,
                session: null,
                isAuthenticated: false,
            });
            localStorage.removeItem('fincontrol_unidade');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    refreshUser: async () => {
        const { session } = get();
        if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (profile) {
                set({ user: profile });
            }
        }
    },
}));

// Selectors for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized);
