import { supabase } from '@/lib/supabase';

export interface ActiveSession {
    id: string;
    user_id: string;
    session_token: string;
    device_info: string | null;
    ip_address: string | null;
    created_at: string;
    expires_at: string;
}

// Duração padrão da sessão (7 dias = 168 horas)
const SESSION_DURATION_HOURS = 168;

const DEVICE_TOKEN_KEY = 'fincontrol_device_token';

/**
 * Token único deste dispositivo/navegador, persistido em localStorage.
 * Usado como session_token para identificar qual dispositivo detém a sessão ativa.
 */
export function getDeviceToken(): string {
    let token = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem(DEVICE_TOKEN_KEY, token);
    }
    return token;
}

/**
 * Verifica se existe uma sessão ativa para o usuário
 */
export async function getActiveSession(userId: string): Promise<ActiveSession | null> {
    const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error checking active session:', error);
    }

    return data || null;
}

/**
 * Cria uma nova sessão ativa para o usuário
 */
export async function createSession(
    userId: string,
    deviceInfo?: string
): Promise<ActiveSession | null> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // Primeiro, remove qualquer sessão existente (para garantir unicidade).
    // Isso desconecta o dispositivo anterior, que detecta a troca de token.
    await deleteSession(userId);

    const { data, error } = await supabase
        .from('active_sessions')
        .insert({
            user_id: userId,
            session_token: getDeviceToken(),
            device_info: deviceInfo || getDeviceInfo(),
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating session:', error);
        return null;
    }

    return data;
}

/**
 * Remove a sessão ativa do usuário.
 * Se `onlySessionToken` for informado, remove apenas se a sessão pertencer
 * a esse token (evita apagar a sessão de outro dispositivo que assumiu a conta).
 */
export async function deleteSession(userId: string, onlySessionToken?: string): Promise<boolean> {
    let query = supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);

    if (onlySessionToken) {
        query = query.eq('session_token', onlySessionToken);
    }

    const { error } = await query;

    if (error) {
        console.error('Error deleting session:', error);
        return false;
    }

    return true;
}

/**
 * Verifica se o token da sessão atual é válido
 */
export async function validateSession(
    userId: string,
    sessionToken: string
): Promise<boolean> {
    const session = await getActiveSession(userId);

    if (!session) {
        return false;
    }

    return session.session_token === sessionToken;
}

/**
 * Limpa sessões expiradas (chamada via função do banco)
 */
export async function cleanExpiredSessions(): Promise<number> {
    const { data, error } = await supabase.rpc('clean_expired_sessions');

    if (error) {
        console.error('Error cleaning expired sessions:', error);
        return 0;
    }

    return data || 0;
}

/**
 * Obtém informações do dispositivo atual
 */
function getDeviceInfo(): string {
    if (typeof window === 'undefined') {
        return 'Server';
    }

    const ua = window.navigator.userAgent;
    const {platform} = window.navigator;

    // Detectar tipo de dispositivo
    let device = 'Desktop';
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        device = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
    }

    // Detectar navegador
    let browser = 'Unknown';
    if (/Chrome/i.test(ua) && !/Chromium|Edge/i.test(ua)) {
        browser = 'Chrome';
    } else if (/Firefox/i.test(ua)) {
        browser = 'Firefox';
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        browser = 'Safari';
    } else if (/Edge/i.test(ua)) {
        browser = 'Edge';
    }

    return `${device} - ${browser} (${platform})`;
}
