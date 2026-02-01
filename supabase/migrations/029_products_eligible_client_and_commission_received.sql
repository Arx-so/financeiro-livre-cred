-- Tipo de Cliente Elegível (caixa de seleção) - valor único
ALTER TABLE products ADD COLUMN IF NOT EXISTS eligible_client_type TEXT;

-- Comissão recebida da instituição conveniada (por produto, prazo, valor liberado)
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_received_by JSONB DEFAULT '{}';

-- Outros documentos (campo livre quando "Outros" é marcado na documentação)
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_docs_other TEXT;
