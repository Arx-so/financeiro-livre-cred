-- ============================================
-- FINCONTROL - Recurring Entries Migration
-- Adds support for recurring financial entries
-- ============================================

-- ============================================
-- CREATE RECURRENCE TYPE ENUM
-- ============================================

CREATE TYPE recurrence_type AS ENUM ('diario', 'semanal', 'mensal', 'anual');

-- ============================================
-- ALTER CATEGORIES TABLE
-- Add default recurrence settings for categories
-- ============================================

ALTER TABLE categories ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN default_recurrence_type recurrence_type;
ALTER TABLE categories ADD COLUMN default_recurrence_day INTEGER CHECK (default_recurrence_day IS NULL OR (default_recurrence_day >= 0 AND default_recurrence_day <= 31));

COMMENT ON COLUMN categories.is_recurring IS 'Whether this category defaults to recurring entries';
COMMENT ON COLUMN categories.default_recurrence_type IS 'Default recurrence type: diario, semanal, mensal, anual';
COMMENT ON COLUMN categories.default_recurrence_day IS 'Default day for recurrence: 1-31 for monthly, 0-6 for weekly (0=Sunday)';

-- ============================================
-- ALTER FINANCIAL ENTRIES TABLE
-- Add recurrence fields for individual entries
-- ============================================

ALTER TABLE financial_entries ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE financial_entries ADD COLUMN recurrence_type recurrence_type;
ALTER TABLE financial_entries ADD COLUMN recurrence_day INTEGER CHECK (recurrence_day IS NULL OR (recurrence_day >= 0 AND recurrence_day <= 31));
ALTER TABLE financial_entries ADD COLUMN recurrence_end_date DATE;
ALTER TABLE financial_entries ADD COLUMN recurring_parent_id UUID REFERENCES financial_entries(id) ON DELETE SET NULL;
ALTER TABLE financial_entries ADD COLUMN is_recurring_template BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN financial_entries.is_recurring IS 'Whether this entry is part of a recurrence';
COMMENT ON COLUMN financial_entries.recurrence_type IS 'Recurrence frequency: diario, semanal, mensal, anual';
COMMENT ON COLUMN financial_entries.recurrence_day IS 'Day of recurrence: 1-31 for monthly, 0-6 for weekly';
COMMENT ON COLUMN financial_entries.recurrence_end_date IS 'When the recurrence ends (null = no end)';
COMMENT ON COLUMN financial_entries.recurring_parent_id IS 'Reference to the template entry that generated this entry';
COMMENT ON COLUMN financial_entries.is_recurring_template IS 'If true, this entry is a template and should not appear in regular lists';

-- ============================================
-- INDEXES FOR RECURRING ENTRIES
-- ============================================

CREATE INDEX idx_financial_entries_recurring_parent ON financial_entries(recurring_parent_id) WHERE recurring_parent_id IS NOT NULL;
CREATE INDEX idx_financial_entries_is_recurring_template ON financial_entries(is_recurring_template) WHERE is_recurring_template = TRUE;
CREATE INDEX idx_financial_entries_recurrence ON financial_entries(is_recurring, recurrence_type) WHERE is_recurring = TRUE;

-- ============================================
-- FUNCTION: Calculate next occurrence date
-- ============================================

CREATE OR REPLACE FUNCTION calculate_next_occurrence(
    p_base_date DATE,
    p_recurrence_type recurrence_type,
    p_recurrence_day INTEGER,
    p_occurrence_number INTEGER
)
RETURNS DATE AS $$
DECLARE
    result_date DATE;
BEGIN
    CASE p_recurrence_type
        WHEN 'diario' THEN
            result_date := p_base_date + (p_occurrence_number * INTERVAL '1 day');
        WHEN 'semanal' THEN
            result_date := p_base_date + (p_occurrence_number * INTERVAL '1 week');
        WHEN 'mensal' THEN
            -- Add months and adjust to the specified day
            result_date := p_base_date + (p_occurrence_number * INTERVAL '1 month');
            IF p_recurrence_day IS NOT NULL THEN
                -- Adjust to the specified day of the month
                result_date := DATE_TRUNC('month', result_date) + ((LEAST(p_recurrence_day, EXTRACT(DAY FROM (DATE_TRUNC('month', result_date) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER) - 1) * INTERVAL '1 day');
            END IF;
        WHEN 'anual' THEN
            result_date := p_base_date + (p_occurrence_number * INTERVAL '1 year');
        ELSE
            result_date := p_base_date;
    END CASE;
    
    RETURN result_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Generate recurring entries
-- Called by the Edge Function cron job
-- ============================================

CREATE OR REPLACE FUNCTION generate_recurring_entries(
    p_months_ahead INTEGER DEFAULT 12
)
RETURNS TABLE(
    created_count INTEGER,
    updated_count INTEGER
) AS $$
DECLARE
    template RECORD;
    occurrence_date DATE;
    occurrence_num INTEGER;
    end_date DATE;
    max_date DATE;
    created_entries INTEGER := 0;
    updated_entries INTEGER := 0;
BEGIN
    -- Calculate the maximum date to generate entries for
    max_date := CURRENT_DATE + (p_months_ahead * INTERVAL '1 month');
    
    -- Loop through all recurring templates
    FOR template IN 
        SELECT * FROM financial_entries 
        WHERE is_recurring_template = TRUE 
        AND is_recurring = TRUE
        AND recurrence_type IS NOT NULL
    LOOP
        -- Determine end date (use template end date or max_date)
        end_date := COALESCE(template.recurrence_end_date, max_date);
        IF end_date > max_date THEN
            end_date := max_date;
        END IF;
        
        -- Generate occurrences
        occurrence_num := 1;
        LOOP
            occurrence_date := calculate_next_occurrence(
                template.due_date,
                template.recurrence_type,
                template.recurrence_day,
                occurrence_num
            );
            
            EXIT WHEN occurrence_date > end_date;
            
            -- Only create if doesn't exist and is in the future or today
            IF occurrence_date >= CURRENT_DATE THEN
                -- Check if this occurrence already exists
                IF NOT EXISTS (
                    SELECT 1 FROM financial_entries 
                    WHERE recurring_parent_id = template.id 
                    AND due_date = occurrence_date
                ) THEN
                    -- Create new entry
                    INSERT INTO financial_entries (
                        branch_id,
                        type,
                        description,
                        value,
                        due_date,
                        category_id,
                        subcategory_id,
                        favorecido_id,
                        bank_account_id,
                        status,
                        notes,
                        document_number,
                        created_by,
                        is_recurring,
                        recurrence_type,
                        recurrence_day,
                        recurring_parent_id,
                        is_recurring_template
                    ) VALUES (
                        template.branch_id,
                        template.type,
                        template.description,
                        template.value,
                        occurrence_date,
                        template.category_id,
                        template.subcategory_id,
                        template.favorecido_id,
                        template.bank_account_id,
                        'pendente',
                        template.notes,
                        template.document_number,
                        template.created_by,
                        TRUE,
                        template.recurrence_type,
                        template.recurrence_day,
                        template.id,
                        FALSE
                    );
                    created_entries := created_entries + 1;
                END IF;
            END IF;
            
            occurrence_num := occurrence_num + 1;
            
            -- Safety limit to prevent infinite loops
            EXIT WHEN occurrence_num > 500;
        END LOOP;
    END LOOP;
    
    -- Update overdue entries
    UPDATE financial_entries
    SET status = 'atrasado'
    WHERE status = 'pendente'
    AND due_date < CURRENT_DATE
    AND is_recurring_template = FALSE;
    
    GET DIAGNOSTICS updated_entries = ROW_COUNT;
    
    RETURN QUERY SELECT created_entries, updated_entries;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Create recurring template
-- Helper function to create a recurring entry template
-- ============================================

CREATE OR REPLACE FUNCTION create_recurring_template(
    p_branch_id UUID,
    p_type entry_type,
    p_description TEXT,
    p_value DECIMAL,
    p_start_date DATE,
    p_recurrence_type recurrence_type,
    p_recurrence_day INTEGER DEFAULT NULL,
    p_recurrence_end_date DATE DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_subcategory_id UUID DEFAULT NULL,
    p_favorecido_id UUID DEFAULT NULL,
    p_bank_account_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_document_number TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    template_id UUID;
BEGIN
    INSERT INTO financial_entries (
        branch_id,
        type,
        description,
        value,
        due_date,
        category_id,
        subcategory_id,
        favorecido_id,
        bank_account_id,
        status,
        notes,
        document_number,
        created_by,
        is_recurring,
        recurrence_type,
        recurrence_day,
        recurrence_end_date,
        is_recurring_template
    ) VALUES (
        p_branch_id,
        p_type,
        p_description,
        p_value,
        p_start_date,
        p_category_id,
        p_subcategory_id,
        p_favorecido_id,
        p_bank_account_id,
        'pendente',
        p_notes,
        p_document_number,
        p_created_by,
        TRUE,
        p_recurrence_type,
        p_recurrence_day,
        p_recurrence_end_date,
        TRUE
    )
    RETURNING id INTO template_id;
    
    RETURN template_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant execution permissions
-- ============================================

GRANT EXECUTE ON FUNCTION calculate_next_occurrence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_recurring_entries TO service_role;
GRANT EXECUTE ON FUNCTION create_recurring_template TO authenticated;
