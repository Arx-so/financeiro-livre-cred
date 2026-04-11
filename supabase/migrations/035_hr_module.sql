-- ============================================
-- HR MODULE TABLES
-- Módulo de Recursos Humanos
-- ============================================

-- ============================================
-- TABLE: employee_vacations
-- Férias de funcionários
-- ============================================

CREATE TABLE employee_vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,

    -- Entitlement info
    admission_date DATE NOT NULL,
    last_vacation_period_end DATE,
    vacation_expiry_date DATE NOT NULL,
    max_grant_deadline DATE,

    -- Usage
    vacation_start_date DATE,
    vacation_end_date DATE,
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente', 'programada', 'em_andamento', 'concluida')),

    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_vacations_branch ON employee_vacations(branch_id);
CREATE INDEX idx_employee_vacations_employee ON employee_vacations(employee_id);
CREATE INDEX idx_employee_vacations_status ON employee_vacations(status);
CREATE INDEX idx_employee_vacations_expiry ON employee_vacations(vacation_expiry_date);

CREATE TRIGGER update_employee_vacations_updated_at
    BEFORE UPDATE ON employee_vacations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE employee_vacations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all employee_vacations" ON employee_vacations
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage employee_vacations" ON employee_vacations
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage employee_vacations" ON employee_vacations
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view employee_vacations from accessible branches" ON employee_vacations
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert employee_vacations for accessible branches" ON employee_vacations
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update employee_vacations from accessible branches" ON employee_vacations
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: occupational_exams
-- Exames Ocupacionais
-- ============================================

CREATE TABLE occupational_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,

    exam_type TEXT NOT NULL
        CHECK (exam_type IN ('admissional', 'periodico', 'demissional')),
    exam_date DATE NOT NULL,
    exam_expiry_date DATE,

    -- Document
    document_url TEXT,
    document_name TEXT,
    document_type TEXT,

    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_occupational_exams_branch ON occupational_exams(branch_id);
CREATE INDEX idx_occupational_exams_employee ON occupational_exams(employee_id);
CREATE INDEX idx_occupational_exams_type ON occupational_exams(exam_type);
CREATE INDEX idx_occupational_exams_expiry ON occupational_exams(exam_expiry_date);
CREATE UNIQUE INDEX idx_occupational_exams_unique ON occupational_exams(employee_id, exam_type, exam_date);

CREATE TRIGGER update_occupational_exams_updated_at
    BEFORE UPDATE ON occupational_exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE occupational_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all occupational_exams" ON occupational_exams
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage occupational_exams" ON occupational_exams
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage occupational_exams" ON occupational_exams
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view occupational_exams from accessible branches" ON occupational_exams
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert occupational_exams for accessible branches" ON occupational_exams
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update occupational_exams from accessible branches" ON occupational_exams
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: vt_recharges
-- Recargas de Vale Transporte
-- ============================================

CREATE TABLE vt_recharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,

    recharge_amount NUMERIC(10, 2) NOT NULL CHECK (recharge_amount > 0),
    recharge_date DATE NOT NULL,

    -- Optional integration with payroll
    payroll_id UUID REFERENCES payroll(id) ON DELETE SET NULL,

    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vt_recharges_branch ON vt_recharges(branch_id);
CREATE INDEX idx_vt_recharges_employee ON vt_recharges(employee_id);
CREATE INDEX idx_vt_recharges_date ON vt_recharges(recharge_date);

CREATE TRIGGER update_vt_recharges_updated_at
    BEFORE UPDATE ON vt_recharges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE vt_recharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all vt_recharges" ON vt_recharges
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage vt_recharges" ON vt_recharges
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage vt_recharges" ON vt_recharges
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view vt_recharges from accessible branches" ON vt_recharges
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vt_recharges for accessible branches" ON vt_recharges
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: corporate_holidays
-- Calendário Corporativo / Feriados
-- ============================================

CREATE TABLE corporate_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    holiday_date DATE NOT NULL,
    description TEXT NOT NULL,
    holiday_type TEXT NOT NULL
        CHECK (holiday_type IN ('nacional', 'estadual', 'municipal')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (branch_id, holiday_date)
);

CREATE INDEX idx_corporate_holidays_branch ON corporate_holidays(branch_id);
CREATE INDEX idx_corporate_holidays_date ON corporate_holidays(holiday_date);

CREATE TRIGGER update_corporate_holidays_updated_at
    BEFORE UPDATE ON corporate_holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE corporate_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all corporate_holidays" ON corporate_holidays
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage corporate_holidays" ON corporate_holidays
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Users can view corporate_holidays from accessible branches" ON corporate_holidays
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert corporate_holidays for accessible branches" ON corporate_holidays
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update corporate_holidays from accessible branches" ON corporate_holidays
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete corporate_holidays from accessible branches" ON corporate_holidays
    FOR DELETE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: medical_certificates
-- Relação de Atestados
-- ============================================

CREATE TABLE medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,

    certificate_date DATE NOT NULL,
    absence_days INTEGER NOT NULL CHECK (absence_days > 0),
    certificate_type TEXT NOT NULL
        CHECK (certificate_type IN ('atestado', 'declaracao')),

    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_certificates_branch ON medical_certificates(branch_id);
CREATE INDEX idx_medical_certificates_employee ON medical_certificates(employee_id);
CREATE INDEX idx_medical_certificates_date ON medical_certificates(certificate_date);

CREATE TRIGGER update_medical_certificates_updated_at
    BEFORE UPDATE ON medical_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all medical_certificates" ON medical_certificates
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage medical_certificates" ON medical_certificates
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage medical_certificates" ON medical_certificates
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view medical_certificates from accessible branches" ON medical_certificates
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert medical_certificates for accessible branches" ON medical_certificates
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: hr_alerts
-- Sistema de Alertas RH
-- ============================================

CREATE TABLE hr_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    alert_type TEXT NOT NULL,
    employee_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,
    related_entity_type TEXT,
    related_entity_id UUID,

    alert_title TEXT NOT NULL,
    alert_message TEXT,
    alert_date DATE NOT NULL,

    dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hr_alerts_branch ON hr_alerts(branch_id);
CREATE INDEX idx_hr_alerts_employee ON hr_alerts(employee_id);
CREATE INDEX idx_hr_alerts_type ON hr_alerts(alert_type);
CREATE INDEX idx_hr_alerts_date ON hr_alerts(alert_date);
CREATE INDEX idx_hr_alerts_dismissed ON hr_alerts(dismissed);

CREATE TRIGGER update_hr_alerts_updated_at
    BEFORE UPDATE ON hr_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE hr_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all hr_alerts" ON hr_alerts
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage hr_alerts" ON hr_alerts
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage hr_alerts" ON hr_alerts
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view hr_alerts from accessible branches" ON hr_alerts
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update hr_alerts from accessible branches" ON hr_alerts
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- ADD admission_date TO favorecidos (if not present)
-- ============================================

ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS admission_date DATE;
