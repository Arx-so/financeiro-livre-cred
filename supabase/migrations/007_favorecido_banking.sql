-- ============================================
-- Migration 007: Add banking data to favorecidos
-- ============================================

-- Banking information
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS bank_agency TEXT;
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS bank_account_type TEXT; -- 'corrente', 'poupanca'

-- PIX information
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS pix_key_type TEXT; -- 'cpf', 'cnpj', 'email', 'telefone', 'aleatoria'

-- Payment preference
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS preferred_payment_type TEXT; -- 'pix', 'ted', 'boleto', 'cartao', 'dinheiro'

-- Birth date for birthday reminders
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create index for birthday queries
CREATE INDEX IF NOT EXISTS idx_favorecidos_birth_date ON favorecidos(birth_date);

COMMENT ON COLUMN favorecidos.bank_name IS 'Nome do banco do favorecido';
COMMENT ON COLUMN favorecidos.bank_agency IS 'Agência bancária';
COMMENT ON COLUMN favorecidos.bank_account IS 'Número da conta bancária';
COMMENT ON COLUMN favorecidos.bank_account_type IS 'Tipo de conta: corrente ou poupanca';
COMMENT ON COLUMN favorecidos.pix_key IS 'Chave PIX do favorecido';
COMMENT ON COLUMN favorecidos.pix_key_type IS 'Tipo da chave PIX: cpf, cnpj, email, telefone, aleatoria';
COMMENT ON COLUMN favorecidos.preferred_payment_type IS 'Forma de pagamento preferida';
COMMENT ON COLUMN favorecidos.birth_date IS 'Data de nascimento para lembretes de aniversário';
