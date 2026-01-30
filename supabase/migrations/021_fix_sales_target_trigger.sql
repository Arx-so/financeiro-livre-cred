-- Migration 021: Fix sales target trigger function
-- Fixes the column name from achieved_amount to actual_amount in the trigger function

-- Recreate the function with the correct column name
CREATE OR REPLACE FUNCTION update_sales_target_from_contract()
RETURNS TRIGGER AS $$
DECLARE
    contract_year INT;
    contract_month INT;
BEGIN
    -- Only process if seller_id is set and status is 'ativo' or 'aprovado'
    -- Use ::text cast to handle enum comparison safely
    IF NEW.seller_id IS NOT NULL AND NEW.status::text IN ('ativo', 'aprovado') THEN
        contract_year := EXTRACT(YEAR FROM NEW.start_date);
        contract_month := EXTRACT(MONTH FROM NEW.start_date);

        -- Update the sales target for this seller/branch/period
        -- Fixed: use actual_amount instead of achieved_amount
        UPDATE sales_targets
        SET actual_amount = actual_amount + NEW.value,
            updated_at = now()
        WHERE branch_id = NEW.branch_id
          AND seller_id = NEW.seller_id
          AND year = contract_year
          AND month = contract_month;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The triggers should already exist, so we don't need to recreate them
-- They will automatically use the updated function
