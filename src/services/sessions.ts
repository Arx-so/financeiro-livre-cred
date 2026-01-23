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
    sessionToken: string,
    deviceInfo?: string
): Promise<ActiveSession | null> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // Primeiro, remove qualquer sessão existente (para garantir unicidade)
    await deleteSession(userId);

    const { data, error } = await supabase
        .from('active_sessions')
        .insert({
            user_id: userId,
            session_token: sessionToken,
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
 * Remove a sessão ativa do usuário
 */
export async function deleteSession(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting session:', error);
        return false;
    }

    return true;
}

/**
 * Atualiza o token da sessão existente
 */
export async function updateSessionToken(
    userId: string,
    newToken: string
): Promise<boolean> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    const { error } = await supabase
        .from('active_sessions')
        .update({
            session_token: newToken,
            expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating session token:', error);
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
    const platform = window.navigator.platform;

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
