import { create } from 'zustand';
import { Session, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    getActiveSession, createSession, deleteSession, getDeviceToken
} from '@/services/sessions';
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
  // Existe sessão ativa em outro dispositivo — o login precisa ser confirmado com force
  requiresTakeover?: boolean;
  activeDeviceInfo?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string, options?: { force?: boolean }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  // Retorna true se a sessão foi assumida por outro dispositivo e o usuário foi deslogado
  checkActiveSession: () => Promise<boolean>;
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
    } catch {
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
                // Verifica se outro dispositivo assumiu a sessão enquanto este estava fechado
                const activeSession = await getActiveSession(initialSession.user.id);
                if (activeSession && activeSession.session_token !== getDeviceToken()) {
                    await supabase.auth.signOut();
                    toast.warning('Sua sessão foi encerrada porque a conta foi conectada em outro dispositivo.');
                } else {
                    set({ session: initialSession });

                    const profile = await fetchUserProfile(initialSession.user.id);
                    if (profile) {
                        // Atualiza ou cria sessão ativa ao restaurar autenticação
                        await createSession(profile.id);
                        set({ user: profile, isAuthenticated: true });
                    }
                }
            }
        } catch {
            // Silent fail on init
        } finally {
            set({ isLoading: false, isInitialized: true });
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, newSession) => {
            set({ session: newSession });

            // Only handle sign out here - sign in is handled by login()
            if (event === 'SIGNED_OUT') {
                const currentUser = get().user;
                if (currentUser) {
                    // Remove apenas a sessão deste dispositivo
                    await deleteSession(currentUser.id, getDeviceToken());
                }
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
                localStorage.removeItem('fincontrol_unidade');
            }
        });
    },

    login: async (email, password, options) => {
        try {
            // Não altera o isLoading global aqui: isso desmontaria a tela de
            // Login (PublicRoute mostra LoadingScreen), perdendo o estado do
            // modal de takeover. A tela de Login tem seu próprio loading local.

            // Primeiro, tenta autenticar para obter o user ID
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: translateAuthError(error) };
            }

            if (!data.user) {
                return { success: false, error: 'Erro ao autenticar usuário' };
            }

            // Verificar se existe sessão ativa em outro dispositivo
            const activeSession = await getActiveSession(data.user.id);
            const isOtherDevice = activeSession && activeSession.session_token !== getDeviceToken();
            if (isOtherDevice && !options?.force) {
                // Fazer logout do Supabase para limpar esta tentativa;
                // o usuário confirma o takeover e o login é refeito com force
                await supabase.auth.signOut();
                return {
                    success: false,
                    requiresTakeover: true,
                    activeDeviceInfo: activeSession.device_info,
                };
            }

            // Fetch profile directly in login() to ensure it completes before returning
            const profile = await fetchUserProfile(data.user.id);

            if (!profile) {
                await supabase.auth.signOut();
                return { success: false, error: 'Perfil de usuário não encontrado. Entre em contato com o administrador.' };
            }

            // Criar sessão ativa (remove a sessão do outro dispositivo, se houver;
            // o outro dispositivo detecta a troca e é desconectado)
            await createSession(data.user.id);

            set({
                user: profile,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
            });

            return { success: true };
        } catch {
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
        } catch {
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
        } catch {
            return { success: false, error: 'Erro ao enviar email de recuperação.' };
        }
    },

    logout: async () => {
        try {
            const currentUser = get().user;

            // Remove a sessão ativa deste dispositivo do banco
            if (currentUser) {
                await deleteSession(currentUser.id, getDeviceToken());
            }

            await supabase.auth.signOut();
            set({
                user: null,
                session: null,
                isAuthenticated: false,
            });
            localStorage.removeItem('fincontrol_unidade');
        } catch {
            // Silent fail on logout
        }
    },

    checkActiveSession: async () => {
        const { user, isAuthenticated } = get();
        if (!user || !isAuthenticated) return false;

        const activeSession = await getActiveSession(user.id);

        // Outro dispositivo assumiu a sessão — desloga este
        if (activeSession && activeSession.session_token !== getDeviceToken()) {
            await supabase.auth.signOut();
            set({
                user: null,
                session: null,
                isAuthenticated: false,
            });
            localStorage.removeItem('fincontrol_unidade');
            toast.warning('Sua sessão foi encerrada porque a conta foi conectada em outro dispositivo.');
            return true;
        }

        return false;
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
