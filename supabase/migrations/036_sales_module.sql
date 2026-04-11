-- ============================================
-- SALES MODULE TABLES
-- Módulo de Vendas
-- ============================================

-- ============================================
-- TABLE: sales_credit_card
-- Vendas com Cartão de Crédito
-- ============================================

CREATE TABLE sales_credit_card (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    -- Client
    client_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE RESTRICT,

    -- Sale amounts
    sale_value NUMERIC(10, 2) NOT NULL CHECK (sale_value > 0),
    terminal_amount NUMERIC(10, 2) NOT NULL CHECK (terminal_amount > 0),
    fee_rate NUMERIC(8, 4) NOT NULL DEFAULT 0,

    -- Terminal and card details
    terminal TEXT NOT NULL CHECK (
        terminal IN (
            'sumup_w', 'sumup_r', 'sumup_h', 'laranjinha_h',
            'c6_r', 'pague_veloz', 'mercado_pago_r', 'pagbank_h'
        )
    ),
    card_brand TEXT NOT NULL CHECK (card_brand IN ('master', 'visa', 'elo', 'amex', 'hiper')),
    card_last_four CHAR(4) NOT NULL,
    card_holder_name TEXT,

    -- Seller
    seller_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE RESTRICT,
    sale_type TEXT NOT NULL DEFAULT 'venda_nova'
        CHECK (sale_type IN ('venda_nova', 'casa')),

    -- Payment
    payment_method TEXT NOT NULL
        CHECK (payment_method IN ('especie', 'pix', 'tec', 'pix_especie')),
    payment_account TEXT,

    -- Documents
    receipt_url TEXT,
    document_urls JSONB,

    -- Status
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente', 'pago', 'cancelado')),
    payment_date DATE,

    -- Commission
    commission_calculated BOOLEAN NOT NULL DEFAULT FALSE,
    commission_amount NUMERIC(10, 2),

    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_credit_card_branch ON sales_credit_card(branch_id);
CREATE INDEX idx_sales_credit_card_client ON sales_credit_card(client_id);
CREATE INDEX idx_sales_credit_card_seller ON sales_credit_card(seller_id);
CREATE INDEX idx_sales_credit_card_terminal ON sales_credit_card(terminal);
CREATE INDEX idx_sales_credit_card_status ON sales_credit_card(status);
CREATE INDEX idx_sales_credit_card_created_at ON sales_credit_card(created_at);

CREATE TRIGGER update_sales_credit_card_updated_at
    BEFORE UPDATE ON sales_credit_card
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sales_credit_card ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sales_credit_card" ON sales_credit_card
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can view all sales_credit_card" ON sales_credit_card
    FOR SELECT USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage sales_credit_card" ON sales_credit_card
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view sales_credit_card from accessible branches" ON sales_credit_card
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sales_credit_card for accessible branches" ON sales_credit_card
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sales_credit_card from accessible branches" ON sales_credit_card
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: sales_d_plus_products
-- Vendas D+ Produtos (Empréstimos)
-- ============================================

CREATE TABLE sales_d_plus_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    -- Client
    client_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE RESTRICT,

    -- Proposal details
    proposal_number TEXT NOT NULL,
    contract_value NUMERIC(10, 2) NOT NULL CHECK (contract_value > 0),

    -- User-entered fields (no server validation)
    table_info TEXT,
    bank_info TEXT,

    -- Seller
    seller_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE RESTRICT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente', 'ativo', 'cancelado')),

    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proposal number must be unique per branch per year (enforced via partial index pattern)
CREATE UNIQUE INDEX idx_sales_d_plus_proposal_unique ON sales_d_plus_products(branch_id, proposal_number);

CREATE INDEX idx_sales_d_plus_branch ON sales_d_plus_products(branch_id);
CREATE INDEX idx_sales_d_plus_client ON sales_d_plus_products(client_id);
CREATE INDEX idx_sales_d_plus_seller ON sales_d_plus_products(seller_id);
CREATE INDEX idx_sales_d_plus_status ON sales_d_plus_products(status);
CREATE INDEX idx_sales_d_plus_created_at ON sales_d_plus_products(created_at);

CREATE TRIGGER update_sales_d_plus_products_updated_at
    BEFORE UPDATE ON sales_d_plus_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sales_d_plus_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sales_d_plus_products" ON sales_d_plus_products
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can view all sales_d_plus_products" ON sales_d_plus_products
    FOR SELECT USING (get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Financeiro can manage sales_d_plus_products" ON sales_d_plus_products
    FOR ALL USING (get_user_role(auth.uid()) = 'financeiro');

CREATE POLICY "Users can view sales_d_plus_products from accessible branches" ON sales_d_plus_products
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sales_d_plus_products for accessible branches" ON sales_d_plus_products
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sales_d_plus_products from accessible branches" ON sales_d_plus_products
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
    );
