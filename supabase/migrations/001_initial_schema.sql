-- ============================================
-- FINCONTROL - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'usuario');
CREATE TYPE favorecido_tipo AS ENUM ('cliente', 'fornecedor', 'funcionario', 'ambos');
CREATE TYPE entry_type AS ENUM ('receita', 'despesa');
CREATE TYPE entry_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE contract_status AS ENUM ('ativo', 'pendente', 'encerrado');
CREATE TYPE reconciliation_status AS ENUM ('pendente', 'conciliado', 'divergente');
CREATE TYPE statement_type AS ENUM ('credito', 'debito');

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'usuario',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BRANCHES TABLE
-- ============================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER BRANCH ACCESS (many-to-many)
-- ============================================

CREATE TABLE user_branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, branch_id)
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'ambos')),
    color TEXT NOT NULL DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SUBCATEGORIES TABLE
-- ============================================

CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FAVORECIDOS TABLE (clients, suppliers, employees)
-- ============================================

CREATE TABLE favorecidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type favorecido_tipo NOT NULL,
    name TEXT NOT NULL,
    document TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    category TEXT,
    photo_url TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BANK ACCOUNTS TABLE
-- ============================================

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    agency TEXT,
    account_number TEXT,
    initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FINANCIAL ENTRIES TABLE
-- ============================================

CREATE TABLE financial_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    type entry_type NOT NULL,
    description TEXT NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    favorecido_id UUID REFERENCES favorecidos(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    status entry_status NOT NULL DEFAULT 'pendente',
    notes TEXT,
    document_number TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BANK STATEMENTS TABLE
-- ============================================

CREATE TABLE bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    type statement_type NOT NULL,
    balance DECIMAL(15, 2),
    reference TEXT,
    reconciliation_status reconciliation_status NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RECONCILIATIONS TABLE
-- ============================================

CREATE TABLE reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
    financial_entry_id UUID NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    matched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    UNIQUE(bank_statement_id),
    UNIQUE(financial_entry_id)
);

-- ============================================
-- CONTRACTS TABLE
-- ============================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    favorecido_id UUID REFERENCES favorecidos(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status contract_status NOT NULL DEFAULT 'pendente',
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTRACT FILES TABLE
-- ============================================

CREATE TABLE contract_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BUDGET ITEMS TABLE
-- ============================================

CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    budgeted_amount DECIMAL(15, 2) NOT NULL,
    actual_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, category_id, year, month)
);

-- ============================================
-- SALES TARGETS TABLE
-- ============================================

CREATE TABLE sales_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    target_amount DECIMAL(15, 2) NOT NULL,
    actual_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    bonus_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, seller_id, year, month)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_user_branch_access_user ON user_branch_access(user_id);
CREATE INDEX idx_user_branch_access_branch ON user_branch_access(branch_id);
CREATE INDEX idx_financial_entries_branch ON financial_entries(branch_id);
CREATE INDEX idx_financial_entries_type ON financial_entries(type);
CREATE INDEX idx_financial_entries_status ON financial_entries(status);
CREATE INDEX idx_financial_entries_due_date ON financial_entries(due_date);
CREATE INDEX idx_financial_entries_category ON financial_entries(category_id);
CREATE INDEX idx_financial_entries_favorecido ON financial_entries(favorecido_id);
CREATE INDEX idx_bank_statements_account ON bank_statements(bank_account_id);
CREATE INDEX idx_bank_statements_date ON bank_statements(date);
CREATE INDEX idx_bank_statements_status ON bank_statements(reconciliation_status);
CREATE INDEX idx_contracts_branch ON contracts(branch_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_budget_items_branch_year ON budget_items(branch_id, year);
CREATE INDEX idx_sales_targets_branch_year ON sales_targets(branch_id, year);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favorecidos_updated_at BEFORE UPDATE ON favorecidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_entries_updated_at BEFORE UPDATE ON financial_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statements_updated_at BEFORE UPDATE ON bank_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON sales_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branch_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorecidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get user role
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    role_value user_role;
BEGIN
    SELECT role INTO role_value FROM profiles WHERE id = user_id;
    RETURN role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user has access to branch
-- ============================================

CREATE OR REPLACE FUNCTION user_has_branch_access(user_id UUID, branch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value FROM profiles WHERE id = user_id;
    
    -- Admins have access to all branches
    IF user_role_value = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Others need explicit access
    RETURN EXISTS (
        SELECT 1 FROM user_branch_access 
        WHERE user_branch_access.user_id = $1 
        AND user_branch_access.branch_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES: PROFILES
-- ============================================

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

-- ============================================
-- RLS POLICIES: BRANCHES
-- ============================================

CREATE POLICY "Users can view accessible branches" ON branches
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'admin' OR
        EXISTS (
            SELECT 1 FROM user_branch_access 
            WHERE user_branch_access.user_id = auth.uid() 
            AND user_branch_access.branch_id = branches.id
        )
    );

CREATE POLICY "Admins can manage branches" ON branches
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- RLS POLICIES: USER BRANCH ACCESS
-- ============================================

CREATE POLICY "Users can view own access" ON user_branch_access
    FOR SELECT USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage access" ON user_branch_access
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- RLS POLICIES: CATEGORIES (global, all users can read)
-- ============================================

CREATE POLICY "All users can view categories" ON categories
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- RLS POLICIES: SUBCATEGORIES
-- ============================================

CREATE POLICY "All users can view subcategories" ON subcategories
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage subcategories" ON subcategories
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- RLS POLICIES: FAVORECIDOS (global)
-- ============================================

CREATE POLICY "All users can view favorecidos" ON favorecidos
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins and gerentes can manage favorecidos" ON favorecidos
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'gerente'));

-- ============================================
-- RLS POLICIES: BANK ACCOUNTS (branch-based)
-- ============================================

CREATE POLICY "Users can view accessible bank accounts" ON bank_accounts
    FOR SELECT USING (user_has_branch_access(auth.uid(), branch_id));

CREATE POLICY "Admins can manage bank accounts" ON bank_accounts
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage branch bank accounts" ON bank_accounts
    FOR ALL USING (
        get_user_role(auth.uid()) = 'gerente' 
        AND user_has_branch_access(auth.uid(), branch_id)
    );

-- ============================================
-- RLS POLICIES: FINANCIAL ENTRIES (branch-based)
-- ============================================

CREATE POLICY "Users can view accessible entries" ON financial_entries
    FOR SELECT USING (user_has_branch_access(auth.uid(), branch_id));

CREATE POLICY "Admins can manage all entries" ON financial_entries
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage branch entries" ON financial_entries
    FOR ALL USING (
        get_user_role(auth.uid()) = 'gerente' 
        AND user_has_branch_access(auth.uid(), branch_id)
    );

-- ============================================
-- RLS POLICIES: BANK STATEMENTS (branch-based via account)
-- ============================================

CREATE POLICY "Users can view accessible statements" ON bank_statements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bank_accounts 
            WHERE bank_accounts.id = bank_statements.bank_account_id
            AND user_has_branch_access(auth.uid(), bank_accounts.branch_id)
        )
    );

CREATE POLICY "Admins and gerentes can manage statements" ON bank_statements
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'gerente')
        AND EXISTS (
            SELECT 1 FROM bank_accounts 
            WHERE bank_accounts.id = bank_statements.bank_account_id
            AND user_has_branch_access(auth.uid(), bank_accounts.branch_id)
        )
    );

-- ============================================
-- RLS POLICIES: RECONCILIATIONS
-- ============================================

CREATE POLICY "Users can view accessible reconciliations" ON reconciliations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bank_statements 
            JOIN bank_accounts ON bank_accounts.id = bank_statements.bank_account_id
            WHERE bank_statements.id = reconciliations.bank_statement_id
            AND user_has_branch_access(auth.uid(), bank_accounts.branch_id)
        )
    );

CREATE POLICY "Admins and gerentes can manage reconciliations" ON reconciliations
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'gerente'));

-- ============================================
-- RLS POLICIES: CONTRACTS (branch-based)
-- ============================================

CREATE POLICY "Users can view accessible contracts" ON contracts
    FOR SELECT USING (user_has_branch_access(auth.uid(), branch_id));

CREATE POLICY "Admins can manage all contracts" ON contracts
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage branch contracts" ON contracts
    FOR ALL USING (
        get_user_role(auth.uid()) = 'gerente' 
        AND user_has_branch_access(auth.uid(), branch_id)
    );

-- ============================================
-- RLS POLICIES: CONTRACT FILES
-- ============================================

CREATE POLICY "Users can view accessible contract files" ON contract_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_files.contract_id
            AND user_has_branch_access(auth.uid(), contracts.branch_id)
        )
    );

CREATE POLICY "Admins and gerentes can manage contract files" ON contract_files
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'gerente'));

-- ============================================
-- RLS POLICIES: BUDGET ITEMS (branch-based)
-- ============================================

CREATE POLICY "Users can view accessible budgets" ON budget_items
    FOR SELECT USING (user_has_branch_access(auth.uid(), branch_id));

CREATE POLICY "Admins can manage all budgets" ON budget_items
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage branch budgets" ON budget_items
    FOR ALL USING (
        get_user_role(auth.uid()) = 'gerente' 
        AND user_has_branch_access(auth.uid(), branch_id)
    );

-- ============================================
-- RLS POLICIES: SALES TARGETS (branch-based)
-- ============================================

CREATE POLICY "Users can view accessible sales targets" ON sales_targets
    FOR SELECT USING (user_has_branch_access(auth.uid(), branch_id));

CREATE POLICY "Admins can manage all sales targets" ON sales_targets
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage branch sales targets" ON sales_targets
    FOR ALL USING (
        get_user_role(auth.uid()) = 'gerente' 
        AND user_has_branch_access(auth.uid(), branch_id)
    );

-- ============================================
-- FUNCTION: Create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
        'usuario'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- INITIAL DATA: Default branches
-- ============================================

INSERT INTO branches (name, code) VALUES
    ('Matriz', 'MTZ'),
    ('Filial Centro', 'FLC'),
    ('Filial Norte', 'FLN'),
    ('Filial Sul', 'FLS');

-- ============================================
-- INITIAL DATA: Default categories
-- ============================================

INSERT INTO categories (name, type, color) VALUES
    ('Vendas', 'receita', '#22c55e'),
    ('Serviços', 'receita', '#3b82f6'),
    ('Receitas Financeiras', 'receita', '#10b981'),
    ('Operacional', 'despesa', '#ef4444'),
    ('Fixo', 'despesa', '#f97316'),
    ('Pessoal', 'despesa', '#8b5cf6'),
    ('Impostos', 'despesa', '#ec4899');

-- ============================================
-- INITIAL DATA: Default subcategories
-- ============================================

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['Produtos', 'E-commerce', 'Revenda'])
FROM categories WHERE name = 'Vendas';

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['Consultoria', 'Manutenção', 'Suporte'])
FROM categories WHERE name = 'Serviços';

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['Juros', 'Rendimentos', 'Aplicações'])
FROM categories WHERE name = 'Receitas Financeiras';

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['Matéria Prima', 'Insumos', 'Logística', 'Frete'])
FROM categories WHERE name = 'Operacional';

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['Aluguel', 'Utilidades', 'Internet', 'Telefone'])
FROM categories WHERE name = 'Fixo';

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['Salários', 'Benefícios', 'Treinamento', 'Comissões'])
FROM categories WHERE name = 'Pessoal';

INSERT INTO subcategories (category_id, name)
SELECT id, unnest(ARRAY['ICMS', 'ISS', 'PIS/COFINS', 'IRPJ'])
FROM categories WHERE name = 'Impostos';
