-- Recorrência do produto (mesma do contrato: único, mensal, anual)
-- Usada para definir a recorrência da venda quando vinculada ao produto
ALTER TABLE products
ADD COLUMN IF NOT EXISTS recurrence_type TEXT
CHECK (recurrence_type IN ('unico', 'mensal', 'anual'));

COMMENT ON COLUMN products.recurrence_type IS 'Recorrência padrão para vendas vinculadas a este produto';
