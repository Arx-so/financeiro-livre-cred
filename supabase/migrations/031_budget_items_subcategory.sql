-- Migration: Budget Items Subcategory Support
-- Adds subcategory_id to budget_items so budgets can be planned at subcategory level,
-- and adds a unique constraint for subcategory-level upserts.

-- 1. Add subcategory_id column to budget_items
ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL;

-- 2. Index for faster subcategory lookups
CREATE INDEX IF NOT EXISTS idx_budget_items_subcategory ON budget_items(subcategory_id)
    WHERE subcategory_id IS NOT NULL;

-- 3. Unique constraint for subcategory-level upserts.
--    The existing UNIQUE(branch_id, category_id, year, month) handles category-level rows (subcategory_id NULL).
--    This non-partial unique index is required by PostgREST for onConflict matching.
--    When subcategory_id is NULL the original constraint already prevents duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_items_subcategory_unique
    ON budget_items(branch_id, category_id, subcategory_id, year, month);

-- 4. Update duplicate_budget_version function to also copy subcategory_id
CREATE OR REPLACE FUNCTION duplicate_budget_version(
    p_source_version_id uuid,
    p_new_name text,
    p_created_by uuid
)
RETURNS uuid AS $$
DECLARE
    v_source budget_versions%ROWTYPE;
    v_new_version_id uuid;
    v_next_version int;
BEGIN
    -- Get source version
    SELECT * INTO v_source FROM budget_versions WHERE id = p_source_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source version not found';
    END IF;

    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
    FROM budget_versions
    WHERE branch_id = v_source.branch_id AND year = v_source.year;

    -- Create new version
    INSERT INTO budget_versions (branch_id, year, version, name, created_by)
    VALUES (v_source.branch_id, v_source.year, v_next_version, p_new_name, p_created_by)
    RETURNING id INTO v_new_version_id;

    -- Copy budget items (now including subcategory_id)
    INSERT INTO budget_items (branch_id, category_id, subcategory_id, year, month, budgeted_amount, budget_version_id)
    SELECT branch_id, category_id, subcategory_id, year, month, budgeted_amount, v_new_version_id
    FROM budget_items
    WHERE budget_version_id = p_source_version_id;

    RETURN v_new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
