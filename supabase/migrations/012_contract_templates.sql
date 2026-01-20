-- ============================================
-- CONTRACT TEMPLATES TABLE
-- Templates para geração automática de contratos
-- ============================================

CREATE TABLE contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_contract_templates_name ON contract_templates(name);
CREATE INDEX idx_contract_templates_active ON contract_templates(is_active);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem visualizar templates ativos
CREATE POLICY "All users can view active templates" ON contract_templates
    FOR SELECT USING (is_active = TRUE);

-- Admins podem ver todos os templates
CREATE POLICY "Admins can view all templates" ON contract_templates
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Admins podem gerenciar templates
CREATE POLICY "Admins can manage templates" ON contract_templates
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Gerentes podem gerenciar templates
CREATE POLICY "Gerentes can manage templates" ON contract_templates
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

-- ============================================
-- SAMPLE DATA: Template de exemplo
-- ============================================

INSERT INTO contract_templates (name, description, content) VALUES
(
    'Contrato de Venda Padrão',
    'Template padrão para contratos de venda de produtos/serviços',
    'CONTRATO DE COMPRA E VENDA

IDENTIFICAÇÃO DAS PARTES

CONTRATANTE: {{nome}}
DOCUMENTO: {{documento}}
ENDEREÇO: {{endereco}}, {{cidade}} - {{estado}}, CEP: {{cep}}
TELEFONE: {{telefone}}
E-MAIL: {{email}}

CONTRATADA: [NOME DA EMPRESA]
CNPJ: [CNPJ DA EMPRESA]

DATA DO CONTRATO: {{data}}

OBJETO DO CONTRATO

O presente contrato tem como objeto a prestação de serviços/venda de produtos conforme acordado entre as partes.

VALOR

O valor total deste contrato é de {{valor}} ({{valor_extenso}}).

CONDIÇÕES DE PAGAMENTO

O pagamento será realizado conforme acordado entre as partes.

DISPOSIÇÕES GERAIS

As partes elegem o foro da comarca de [CIDADE] para dirimir quaisquer dúvidas oriundas deste contrato.

E por estarem assim justos e contratados, firmam o presente instrumento.

{{cidade}}, {{data}}

_______________________________
CONTRATANTE

_______________________________
CONTRATADA'
);
