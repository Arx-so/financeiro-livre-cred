-- ============================================
-- Migration 018: Payroll Batch and Recurrence
-- Adds support for batch payroll creation and recurrence
-- ============================================

-- ============================================
-- ADD CATEGORIA_CONTRATACAO TO FAVORECIDOS
-- ============================================

ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS categoria_contratacao TEXT;

COMMENT ON COLUMN favorecidos.categoria_contratacao IS 'Categoria de contratação do funcionário (ex: CLT, PJ, EXPERIÊNCIA, ESTAGIÁRIO)';

-- Create index for filtering by hiring category
CREATE INDEX IF NOT EXISTS idx_favorecidos_categoria_contratacao ON favorecidos(categoria_contratacao) WHERE categoria_contratacao IS NOT NULL;

-- ============================================
-- ADD BATCH AND RECURRENCE FIELDS TO PAYROLL
-- ============================================

-- Batch fields
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS is_batch BOOLEAN DEFAULT FALSE;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS batch_group_id UUID;

COMMENT ON COLUMN payroll.is_batch IS 'Indica se a folha foi criada em lote';
COMMENT ON COLUMN payroll.batch_group_id IS 'ID do grupo de folhas criadas juntas em lote';

-- Recurrence fields
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IS NULL OR recurrence_type IN ('infinite', 'fixed_months'));
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS recurrence_months INTEGER CHECK (recurrence_months IS NULL OR recurrence_months > 0);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS is_recurring_template BOOLEAN DEFAULT FALSE;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS recurring_parent_id UUID REFERENCES payroll(id) ON DELETE SET NULL;

COMMENT ON COLUMN payroll.is_recurring IS 'Indica se a folha é recorrente';
COMMENT ON COLUMN payroll.recurrence_type IS 'Tipo de recorrência: infinite (sem fim) ou fixed_months (X meses)';
COMMENT ON COLUMN payroll.recurrence_months IS 'Número de meses se recurrence_type for fixed_months';
COMMENT ON COLUMN payroll.recurrence_end_date IS 'Data final da recorrência se for fixed_months';
COMMENT ON COLUMN payroll.is_recurring_template IS 'Se true, esta folha é um template e não aparece em listas regulares';
COMMENT ON COLUMN payroll.recurring_parent_id IS 'Referência ao template que gerou esta folha';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payroll_batch_group ON payroll(batch_group_id) WHERE batch_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payroll_recurring_parent ON payroll(recurring_parent_id) WHERE recurring_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payroll_is_recurring_template ON payroll(is_recurring_template) WHERE is_recurring_template = TRUE;
CREATE INDEX IF NOT EXISTS idx_payroll_recurrence ON payroll(is_recurring, recurrence_type) WHERE is_recurring = TRUE;
