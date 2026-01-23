-- ============================================
-- PAYROLL TABLE
-- Cadastro de folha de pagamento
-- ============================================

CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,
    reference_month INTEGER NOT NULL CHECK (reference_month >= 1 AND reference_month <= 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2000),
    
    -- Salário e benefícios
    base_salary DECIMAL(15, 2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
    overtime_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    transport_allowance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    meal_allowance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    other_benefits DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Descontos
    inss_discount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    irrf_discount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    other_discounts DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Totais
    net_salary DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Status e pagamento
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
    payment_date DATE,
    financial_entry_id UUID REFERENCES financial_entries(id) ON DELETE SET NULL,
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint para evitar duplicatas
    UNIQUE(branch_id, employee_id, reference_month, reference_year)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_payroll_branch ON payroll(branch_id);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_reference ON payroll(reference_year, reference_month);
CREATE INDEX idx_payroll_status ON payroll(status);
CREATE INDEX idx_payroll_financial_entry ON payroll(financial_entry_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todas as folhas
CREATE POLICY "Admins can manage all payroll" ON payroll
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Gerentes podem gerenciar folhas da filial
CREATE POLICY "Gerentes can manage payroll" ON payroll
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

-- Financeiro pode visualizar e gerenciar folhas
CREATE POLICY "Financeiro can manage payroll" ON payroll
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');
