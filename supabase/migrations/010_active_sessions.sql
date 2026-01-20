-- ============================================
-- ACTIVE SESSIONS TABLE
-- Para controle de sessão única por usuário
-- ============================================

CREATE TABLE active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id)
);

-- Índice para busca rápida por usuário
CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);

-- Índice para limpeza de sessões expiradas
CREATE INDEX idx_active_sessions_expires ON active_sessions(expires_at);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias sessões
CREATE POLICY "Users can view own sessions" ON active_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias sessões
CREATE POLICY "Users can insert own sessions" ON active_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias sessões
CREATE POLICY "Users can delete own sessions" ON active_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Admins podem gerenciar todas as sessões
CREATE POLICY "Admins can manage all sessions" ON active_sessions
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- FUNCTION: Limpar sessões expiradas
-- ============================================

CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
