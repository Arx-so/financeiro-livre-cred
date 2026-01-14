-- ============================================
-- Migration 009: Agenda Events and Notifications
-- ============================================

-- Event type enum
DO $$ BEGIN
    CREATE TYPE agenda_event_type AS ENUM ('lembrete', 'aniversario', 'festividade', 'feriado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agenda Events table
CREATE TABLE IF NOT EXISTS agenda_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type agenda_event_type NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME, -- Optional time for reminders
    recurrence_type TEXT, -- 'yearly', 'monthly', 'weekly', 'none'
    related_entity_type TEXT, -- 'favorecido', 'contract', 'financial_entry'
    related_entity_id UUID,
    notify_before_days INTEGER DEFAULT 1,
    notify_users UUID[], -- Array of user IDs to notify
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL, -- 'aniversario', 'lembrete', 'festividade', 'feriado', 'system'
    related_event_id UUID REFERENCES agenda_events(id) ON DELETE SET NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agenda_events_date ON agenda_events(event_date);
CREATE INDEX IF NOT EXISTS idx_agenda_events_type ON agenda_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agenda_events_branch ON agenda_events(branch_id);
CREATE INDEX IF NOT EXISTS idx_agenda_events_active ON agenda_events(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_agenda_events_updated_at BEFORE UPDATE ON agenda_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agenda_events
CREATE POLICY "Users can view accessible agenda events" ON agenda_events
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'admin' OR
        branch_id IS NULL OR
        user_has_branch_access(auth.uid(), branch_id) OR
        created_by = auth.uid() OR
        auth.uid() = ANY(notify_users)
    );

CREATE POLICY "Users can create agenda events" ON agenda_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own events or admins all" ON agenda_events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "Users can delete own events or admins all" ON agenda_events
    FOR DELETE USING (
        created_by = auth.uid() OR
        get_user_role(auth.uid()) = 'admin'
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Insert default Brazilian holidays
INSERT INTO agenda_events (title, event_type, event_date, recurrence_type, is_active, description) VALUES
    ('Ano Novo', 'feriado', '2025-01-01', 'yearly', true, 'Feriado Nacional'),
    ('Carnaval', 'feriado', '2025-03-04', 'yearly', true, 'Feriado Nacional'),
    ('Sexta-feira Santa', 'feriado', '2025-04-18', 'yearly', true, 'Feriado Nacional'),
    ('Tiradentes', 'feriado', '2025-04-21', 'yearly', true, 'Feriado Nacional'),
    ('Dia do Trabalho', 'feriado', '2025-05-01', 'yearly', true, 'Feriado Nacional'),
    ('Corpus Christi', 'feriado', '2025-06-19', 'yearly', true, 'Feriado Nacional'),
    ('Independência do Brasil', 'feriado', '2025-09-07', 'yearly', true, 'Feriado Nacional'),
    ('Nossa Senhora Aparecida', 'feriado', '2025-10-12', 'yearly', true, 'Feriado Nacional'),
    ('Finados', 'feriado', '2025-11-02', 'yearly', true, 'Feriado Nacional'),
    ('Proclamação da República', 'feriado', '2025-11-15', 'yearly', true, 'Feriado Nacional'),
    ('Natal', 'feriado', '2025-12-25', 'yearly', true, 'Feriado Nacional')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE agenda_events IS 'Calendar events including reminders, birthdays, and holidays';
COMMENT ON TABLE notifications IS 'User notifications for events and system messages';
