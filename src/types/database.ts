export type UserRole =
    | 'admin'
    | 'gerente'
    | 'coordenador'
    | 'assistente'
    | 'vendedor'
    | 'seguranca'
    | 'financeiro'
    | 'rh'
    | 'leitura'
    // legacy — kept for backward compatibility
    | 'usuario'
    | 'vendas';
export type ProductType = 'generico' | 'cartao_credito' | 'fgts' | 'consignado';
export type FavorecidoTipo = 'cliente' | 'fornecedor' | 'funcionario' | 'ambos';
export type EntryType = 'receita' | 'despesa';
export type EntryStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type ContractStatus = 'criado' | 'em_aprovacao' | 'aprovado' | 'ativo' | 'pendente' | 'encerrado' | 'rejeitado';
export type ContractRecurrenceType = 'unico' | 'mensal' | 'anual';
export type ReconciliationStatus = 'pendente' | 'conciliado' | 'divergente';
export type RecurrenceType = 'diario' | 'semanal' | 'mensal' | 'anual';
export type BankAccountType = 'corrente' | 'poupanca';
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
export type PaymentType = 'pix' | 'ted' | 'boleto' | 'cartao' | 'dinheiro';
export type AgendaEventType = 'lembrete' | 'aniversario' | 'festividade' | 'feriado';
export type AgendaRecurrenceType = 'yearly' | 'monthly' | 'weekly' | 'none';
export type BudgetFrequency = 'mes_a_mes' | 'mensal' | 'anual' | 'semanal' | 'diario';

export interface BudgetMonthData {
    month: number;
    budgeted: number;
    actual: number;
}

export interface BudgetSubcategoryData {
    subcategoryId: string;
    subcategoryName: string;
    frequency: BudgetFrequency;
    budgetedAnnual: number;
    actualAnnual: number;
    months: BudgetMonthData[];
}

export interface BudgetCategoryWithSubcategories {
    categoryId: string;
    categoryName: string;
    categoryType: 'receita' | 'despesa' | 'ambos';
    color: string;
    frequency: BudgetFrequency;
    budgetedAnnual: number;
    actualAnnual: number;
    months: BudgetMonthData[];
    subcategories: BudgetSubcategoryData[];
}

/** Outras taxas do produto: cadastro, operação, seguro */
export interface ProductOtherFees {
    cadastro?: number;
    operacao?: number;
    seguro?: number;
    [key: string]: number | undefined;
}

/** Comissão recebida da instituição: por produto, prazo, valor liberado */
export interface ProductCommissionReceivedBy {
    by_product?: number;
    by_term?: number;
    by_value?: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      user_branch_access: {
        Row: {
          id: string;
          user_id: string;
          branch_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          branch_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          branch_id?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: EntryType | 'ambos';
          color: string;
          is_active: boolean;
          is_recurring: boolean;
          default_recurrence_type: RecurrenceType | null;
          default_recurrence_day: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: EntryType | 'ambos';
          color?: string;
          is_active?: boolean;
          is_recurring?: boolean;
          default_recurrence_type?: RecurrenceType | null;
          default_recurrence_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: EntryType | 'ambos';
          color?: string;
          is_active?: boolean;
          is_recurring?: boolean;
          default_recurrence_type?: RecurrenceType | null;
          default_recurrence_day?: number | null;
          updated_at?: string;
        };
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      favorecidos: {
        Row: {
          id: string;
          branch_id: string | null;
          type: FavorecidoTipo;
          name: string;
          document: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          category: string | null;
          photo_url: string | null;
          notes: string | null;
          is_active: boolean;
          user_id: string | null;
          // Banking info
          bank_name: string | null;
          bank_agency: string | null;
          bank_account: string | null;
          bank_account_type: BankAccountType | null;
          pix_key: string | null;
          pix_key_type: PixKeyType | null;
          preferred_payment_type: PaymentType | null;
          birth_date: string | null;
          categoria_contratacao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id?: string | null;
          type: FavorecidoTipo;
          name: string;
          document?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          category?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          is_active?: boolean;
          user_id?: string | null;
          // Banking info
          bank_name?: string | null;
          bank_agency?: string | null;
          bank_account?: string | null;
          bank_account_type?: BankAccountType | null;
          pix_key?: string | null;
          pix_key_type?: PixKeyType | null;
          preferred_payment_type?: PaymentType | null;
          birth_date?: string | null;
          categoria_contratacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          type?: FavorecidoTipo;
          name?: string;
          document?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          category?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          is_active?: boolean;
          user_id?: string | null;
          // Banking info
          bank_name?: string | null;
          bank_agency?: string | null;
          bank_account?: string | null;
          bank_account_type?: BankAccountType | null;
          pix_key?: string | null;
          pix_key_type?: PixKeyType | null;
          preferred_payment_type?: PaymentType | null;
          birth_date?: string | null;
          categoria_contratacao?: string | null;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          bank_name: string;
          agency: string | null;
          account_number: string | null;
          initial_balance: number;
          current_balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          bank_name: string;
          agency?: string | null;
          account_number?: string | null;
          initial_balance?: number;
          current_balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          name?: string;
          bank_name?: string;
          agency?: string | null;
          account_number?: string | null;
          initial_balance?: number;
          current_balance?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      financial_entries: {
        Row: {
          id: string;
          branch_id: string;
          type: EntryType;
          description: string;
          value: number;
          due_date: string;
          payment_date: string | null;
          category_id: string | null;
          subcategory_id: string | null;
          favorecido_id: string | null;
          bank_account_id: string | null;
          status: EntryStatus;
          notes: string | null;
          document_number: string | null;
          created_by: string | null;
          is_recurring: boolean;
          recurrence_type: RecurrenceType | null;
          recurrence_day: number | null;
          recurrence_end_date: string | null;
          recurring_parent_id: string | null;
          is_recurring_template: boolean;
          contract_id: string | null;
          credit_card_sale_id: string | null;
          dplus_sale_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          type: EntryType;
          description: string;
          value: number;
          due_date: string;
          payment_date?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          favorecido_id?: string | null;
          bank_account_id?: string | null;
          status?: EntryStatus;
          notes?: string | null;
          document_number?: string | null;
          created_by?: string | null;
          is_recurring?: boolean;
          recurrence_type?: RecurrenceType | null;
          recurrence_day?: number | null;
          recurrence_end_date?: string | null;
          recurring_parent_id?: string | null;
          is_recurring_template?: boolean;
          contract_id?: string | null;
          credit_card_sale_id?: string | null;
          dplus_sale_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          type?: EntryType;
          description?: string;
          value?: number;
          due_date?: string;
          payment_date?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          favorecido_id?: string | null;
          bank_account_id?: string | null;
          status?: EntryStatus;
          notes?: string | null;
          document_number?: string | null;
          is_recurring?: boolean;
          recurrence_type?: RecurrenceType | null;
          recurrence_day?: number | null;
          recurrence_end_date?: string | null;
          recurring_parent_id?: string | null;
          is_recurring_template?: boolean;
          contract_id?: string | null;
          credit_card_sale_id?: string | null;
          dplus_sale_id?: string | null;
          updated_at?: string;
        };
      };
      bank_statements: {
        Row: {
          id: string;
          bank_account_id: string;
          date: string;
          description: string;
          value: number;
          type: 'credito' | 'debito';
          balance: number | null;
          reference: string | null;
          reconciliation_status: ReconciliationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_account_id: string;
          date: string;
          description: string;
          value: number;
          type: 'credito' | 'debito';
          balance?: number | null;
          reference?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bank_account_id?: string;
          date?: string;
          description?: string;
          value?: number;
          type?: 'credito' | 'debito';
          balance?: number | null;
          reference?: string | null;
          reconciliation_status?: ReconciliationStatus;
          updated_at?: string;
        };
      };
      reconciliations: {
        Row: {
          id: string;
          bank_statement_id: string;
          financial_entry_id: string;
          matched_at: string;
          matched_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          bank_statement_id: string;
          financial_entry_id: string;
          matched_at?: string;
          matched_by?: string | null;
          notes?: string | null;
        };
        Update: {
          bank_statement_id?: string;
          financial_entry_id?: string;
          matched_by?: string | null;
          notes?: string | null;
        };
      };
      contracts: {
        Row: {
          id: string;
          branch_id: string;
          title: string;
          favorecido_id: string | null;
          type: string;
          value: number;
          start_date: string;
          end_date: string;
          status: ContractStatus;
          notes: string | null;
          created_by: string | null;
          category_id: string | null;
          product_id: string | null;
          recurrence_type: ContractRecurrenceType;
          seller_id: string | null;
          approved_by: string | null;
          approved_at: string | null;
          signed_by: string | null;
          signed_at: string | null;
          payment_due_day: number | null;
          interest_rate: number | null;
          cc_amount_released: number | null;
          cc_terminal: string | null;
          cc_card_brand: string | null;
          cc_card_last_four: string | null;
          cc_card_holder_name: string | null;
          cc_sale_type: string | null;
          cc_payment_method: string | null;
          cc_payment_account: string | null;
          cc_discount_amount: number | null;
          cc_saturday_refund: number | null;
          cc_lacre: string | null;
          cc_pix_key_type: string | null;
          cc_pix_key: string | null;
          cc_bank_name: string | null;
          cc_bank_agency: string | null;
          cc_bank_account: string | null;
          cc_bank_account_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          title: string;
          favorecido_id?: string | null;
          type?: string | null;
          value: number;
          start_date: string;
          end_date?: string | null;
          status?: ContractStatus;
          notes?: string | null;
          created_by?: string | null;
          category_id?: string | null;
          product_id?: string | null;
          recurrence_type?: ContractRecurrenceType;
          seller_id?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          signed_by?: string | null;
          signed_at?: string | null;
          payment_due_day?: number | null;
          interest_rate?: number | null;
          cc_amount_released?: number | null;
          cc_terminal?: string | null;
          cc_card_brand?: string | null;
          cc_card_last_four?: string | null;
          cc_card_holder_name?: string | null;
          cc_sale_type?: string | null;
          cc_payment_method?: string | null;
          cc_payment_account?: string | null;
          cc_discount_amount?: number | null;
          cc_saturday_refund?: number | null;
          cc_lacre?: string | null;
          cc_pix_key_type?: string | null;
          cc_pix_key?: string | null;
          cc_bank_name?: string | null;
          cc_bank_agency?: string | null;
          cc_bank_account?: string | null;
          cc_bank_account_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          title?: string;
          favorecido_id?: string | null;
          type?: string | null;
          value?: number;
          start_date?: string;
          end_date?: string | null;
          status?: ContractStatus;
          notes?: string | null;
          category_id?: string | null;
          product_id?: string | null;
          recurrence_type?: ContractRecurrenceType;
          seller_id?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          signed_by?: string | null;
          signed_at?: string | null;
          payment_due_day?: number | null;
          interest_rate?: number | null;
          cc_amount_released?: number | null;
          cc_terminal?: string | null;
          cc_card_brand?: string | null;
          cc_card_last_four?: string | null;
          cc_card_holder_name?: string | null;
          cc_sale_type?: string | null;
          cc_payment_method?: string | null;
          cc_payment_account?: string | null;
          cc_discount_amount?: number | null;
          cc_saturday_refund?: number | null;
          cc_lacre?: string | null;
          cc_pix_key_type?: string | null;
          cc_pix_key?: string | null;
          cc_bank_name?: string | null;
          cc_bank_agency?: string | null;
          cc_bank_account?: string | null;
          cc_bank_account_type?: string | null;
          updated_at?: string;
        };
      };
      contract_files: {
        Row: {
          id: string;
          contract_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          contract_id?: string;
          file_name?: string;
          file_url?: string;
          file_type?: string;
          file_size?: number;
        };
      };
      budget_items: {
        Row: {
          id: string;
          branch_id: string;
          category_id: string | null;
          subcategory_id: string | null;
          year: number;
          month: number;
          budgeted_amount: number;
          actual_amount: number;
          budget_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          year: number;
          month: number;
          budgeted_amount: number;
          actual_amount?: number;
          budget_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          year?: number;
          month?: number;
          budgeted_amount?: number;
          actual_amount?: number;
          budget_version_id?: string | null;
          updated_at?: string;
        };
      };
      favorecido_documents: {
        Row: {
          id: string;
          favorecido_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          favorecido_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          favorecido_id?: string;
          file_name?: string;
          file_url?: string;
          file_type?: string;
          file_size?: number;
        };
      };
      sales_targets: {
        Row: {
          id: string;
          branch_id: string;
          seller_id: string;
          year: number;
          month: number;
          target_amount: number;
          actual_amount: number;
          commission_rate: number;
          bonus_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          seller_id: string;
          year: number;
          month: number;
          target_amount: number;
          actual_amount?: number;
          commission_rate?: number;
          bonus_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          seller_id?: string;
          year?: number;
          month?: number;
          target_amount?: number;
          actual_amount?: number;
          commission_rate?: number;
          bonus_amount?: number;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id: string | null;
          user_name: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id?: string | null;
          user_name?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          entity_type?: string;
          entity_id?: string;
          action?: string;
          user_id?: string | null;
          user_name?: string | null;
          details?: Record<string, unknown> | null;
        };
      };
      agenda_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_type: AgendaEventType;
          event_date: string;
          event_time: string | null;
          recurrence_type: AgendaRecurrenceType | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          notify_before_days: number;
          notify_users: string[] | null;
          created_by: string | null;
          branch_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_type: AgendaEventType;
          event_date: string;
          event_time?: string | null;
          recurrence_type?: AgendaRecurrenceType | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          notify_before_days?: number;
          notify_users?: string[] | null;
          created_by?: string | null;
          branch_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_type?: AgendaEventType;
          event_date?: string;
          event_time?: string | null;
          recurrence_type?: AgendaRecurrenceType | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          notify_before_days?: number;
          notify_users?: string[] | null;
          branch_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string | null;
          type: string;
          related_event_id: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message?: string | null;
          type: string;
          related_event_id?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          title?: string;
          message?: string | null;
          type?: string;
          related_event_id?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
        };
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          code: string | null;
          product_category_id: string | null;
          commercial_description: string | null;
          bank_value: number;
          bank_percentage: number;
          company_value: number;
          company_percentage: number;
          is_active: boolean;
          eligible_client_type: string | null;
          target_audience: string[] | null;
          value_min: number | null;
          value_max: number | null;
          term_months_min: number | null;
          term_months_max: number | null;
          interest_rate_min: number | null;
          interest_rate_max: number | null;
          billing_type: string[] | null;
          iof_applicable: boolean;
          other_fees: ProductOtherFees | null;
          specific_rules: Record<string, unknown> | null;
          commission_type: 'fixa' | 'percentual' | null;
          commission_pct: number | null;
          commission_min: number | null;
          commission_max: number | null;
          commission_received_by: ProductCommissionReceivedBy | null;
          commission_payment_day: number | null;
          required_docs: string[] | null;
          required_docs_other: string | null;
          convention_bank: string | null;
          operation_channel: string | null;
          requires_internal_approval: boolean;
          recurrence_type: ContractRecurrenceType | null;
          product_type: ProductType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          code?: string | null;
          product_category_id?: string | null;
          commercial_description?: string | null;
          bank_value?: number;
          bank_percentage?: number;
          company_value?: number;
          company_percentage?: number;
          is_active?: boolean;
          eligible_client_type?: string | null;
          target_audience?: string[] | null;
          value_min?: number | null;
          value_max?: number | null;
          term_months_min?: number | null;
          term_months_max?: number | null;
          interest_rate_min?: number | null;
          interest_rate_max?: number | null;
          billing_type?: string[] | null;
          iof_applicable?: boolean;
          other_fees?: ProductOtherFees | null;
          specific_rules?: Record<string, unknown> | null;
          commission_type?: 'fixa' | 'percentual' | null;
          commission_pct?: number | null;
          commission_min?: number | null;
          commission_max?: number | null;
          commission_received_by?: ProductCommissionReceivedBy | null;
          commission_payment_day?: number | null;
          required_docs?: string[] | null;
          required_docs_other?: string | null;
          convention_bank?: string | null;
          operation_channel?: string | null;
          requires_internal_approval?: boolean;
          recurrence_type?: ContractRecurrenceType | null;
          product_type?: ProductType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          code?: string | null;
          product_category_id?: string | null;
          commercial_description?: string | null;
          bank_value?: number;
          bank_percentage?: number;
          company_value?: number;
          company_percentage?: number;
          is_active?: boolean;
          eligible_client_type?: string | null;
          target_audience?: string[] | null;
          value_min?: number | null;
          value_max?: number | null;
          term_months_min?: number | null;
          term_months_max?: number | null;
          interest_rate_min?: number | null;
          interest_rate_max?: number | null;
          billing_type?: string[] | null;
          iof_applicable?: boolean;
          other_fees?: ProductOtherFees | null;
          specific_rules?: Record<string, unknown> | null;
          commission_type?: 'fixa' | 'percentual' | null;
          commission_pct?: number | null;
          commission_min?: number | null;
          commission_max?: number | null;
          commission_received_by?: ProductCommissionReceivedBy | null;
          commission_payment_day?: number | null;
          required_docs?: string[] | null;
          required_docs_other?: string | null;
          convention_bank?: string | null;
          operation_channel?: string | null;
          requires_internal_approval?: boolean;
          recurrence_type?: ContractRecurrenceType | null;
          product_type?: ProductType;
          updated_at?: string;
        };
      };
      payroll: {
        Row: {
          id: string;
          branch_id: string;
          employee_id: string;
          reference_month: number;
          reference_year: number;
          base_salary: number;
          overtime_hours: number;
          overtime_value: number;
          transport_allowance: number;
          meal_allowance: number;
          other_benefits: number;
          inss_discount: number;
          irrf_discount: number;
          other_discounts: number;
          net_salary: number;
          status: 'pendente' | 'pago';
          payment_date: string | null;
          financial_entry_id: string | null;
          notes: string | null;
          is_batch: boolean;
          batch_group_id: string | null;
          is_recurring: boolean;
          recurrence_type: 'infinite' | 'fixed_months' | null;
          recurrence_months: number | null;
          recurrence_end_date: string | null;
          is_recurring_template: boolean;
          recurring_parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          employee_id: string;
          reference_month: number;
          reference_year: number;
          base_salary: number;
          overtime_hours?: number;
          overtime_value?: number;
          transport_allowance?: number;
          meal_allowance?: number;
          other_benefits?: number;
          inss_discount?: number;
          irrf_discount?: number;
          other_discounts?: number;
          net_salary: number;
          status?: 'pendente' | 'pago';
          payment_date?: string | null;
          financial_entry_id?: string | null;
          notes?: string | null;
          is_batch?: boolean;
          batch_group_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: 'infinite' | 'fixed_months' | null;
          recurrence_months?: number | null;
          recurrence_end_date?: string | null;
          is_recurring_template?: boolean;
          recurring_parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          employee_id?: string;
          reference_month?: number;
          reference_year?: number;
          base_salary?: number;
          overtime_hours?: number;
          overtime_value?: number;
          transport_allowance?: number;
          meal_allowance?: number;
          other_benefits?: number;
          inss_discount?: number;
          irrf_discount?: number;
          other_discounts?: number;
          net_salary?: number;
          status?: 'pendente' | 'pago';
          payment_date?: string | null;
          financial_entry_id?: string | null;
          notes?: string | null;
          is_batch?: boolean;
          batch_group_id?: string | null;
          is_recurring?: boolean;
          recurrence_type?: 'infinite' | 'fixed_months' | null;
          recurrence_months?: number | null;
          recurrence_end_date?: string | null;
          is_recurring_template?: boolean;
          recurring_parent_id?: string | null;
          updated_at?: string;
        };
      };
      employee_vacations: {
        Row: {
          id: string;
          branch_id: string;
          employee_id: string;
          admission_date: string;
          last_vacation_period_end: string | null;
          vacation_expiry_date: string;
          max_grant_deadline: string | null;
          vacation_start_date: string | null;
          vacation_end_date: string | null;
          status: 'pendente' | 'programada' | 'em_andamento' | 'concluida';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          employee_id: string;
          admission_date: string;
          last_vacation_period_end?: string | null;
          vacation_expiry_date: string;
          max_grant_deadline?: string | null;
          vacation_start_date?: string | null;
          vacation_end_date?: string | null;
          status?: 'pendente' | 'programada' | 'em_andamento' | 'concluida';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          employee_id?: string;
          admission_date?: string;
          last_vacation_period_end?: string | null;
          vacation_expiry_date?: string;
          max_grant_deadline?: string | null;
          vacation_start_date?: string | null;
          vacation_end_date?: string | null;
          status?: 'pendente' | 'programada' | 'em_andamento' | 'concluida';
          notes?: string | null;
          updated_at?: string;
        };
      };
      occupational_exams: {
        Row: {
          id: string;
          branch_id: string;
          employee_id: string;
          exam_type: 'admissional' | 'periodico' | 'demissional';
          exam_date: string;
          exam_expiry_date: string | null;
          document_url: string | null;
          document_name: string | null;
          document_type: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          employee_id: string;
          exam_type: 'admissional' | 'periodico' | 'demissional';
          exam_date: string;
          exam_expiry_date?: string | null;
          document_url?: string | null;
          document_name?: string | null;
          document_type?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          employee_id?: string;
          exam_type?: 'admissional' | 'periodico' | 'demissional';
          exam_date?: string;
          exam_expiry_date?: string | null;
          document_url?: string | null;
          document_name?: string | null;
          document_type?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      vt_recharges: {
        Row: {
          id: string;
          branch_id: string;
          employee_id: string;
          recharge_amount: number;
          recharge_date: string;
          payroll_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          employee_id: string;
          recharge_amount: number;
          recharge_date: string;
          payroll_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          employee_id?: string;
          recharge_amount?: number;
          recharge_date?: string;
          payroll_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      corporate_holidays: {
        Row: {
          id: string;
          branch_id: string;
          holiday_date: string;
          description: string;
          holiday_type: 'nacional' | 'estadual' | 'municipal';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          holiday_date: string;
          description: string;
          holiday_type: 'nacional' | 'estadual' | 'municipal';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          holiday_date?: string;
          description?: string;
          holiday_type?: 'nacional' | 'estadual' | 'municipal';
          updated_at?: string;
        };
      };
      medical_certificates: {
        Row: {
          id: string;
          branch_id: string;
          employee_id: string;
          certificate_date: string;
          absence_days: number;
          certificate_type: 'atestado' | 'declaracao';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          employee_id: string;
          certificate_date: string;
          absence_days: number;
          certificate_type: 'atestado' | 'declaracao';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          employee_id?: string;
          certificate_date?: string;
          absence_days?: number;
          certificate_type?: 'atestado' | 'declaracao';
          notes?: string | null;
          updated_at?: string;
        };
      };
      hr_alerts: {
        Row: {
          id: string;
          branch_id: string;
          alert_type: string;
          employee_id: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          alert_title: string;
          alert_message: string | null;
          alert_date: string;
          dismissed: boolean;
          dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          alert_type: string;
          employee_id: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          alert_title: string;
          alert_message?: string | null;
          alert_date: string;
          dismissed?: boolean;
          dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          alert_type?: string;
          employee_id?: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          alert_title?: string;
          alert_message?: string | null;
          alert_date?: string;
          dismissed?: boolean;
          dismissed_at?: string | null;
          updated_at?: string;
        };
      };
      sales_credit_card: {
        Row: {
          id: string;
          branch_id: string;
          client_id: string;
          sale_value: number;
          terminal_amount: number;
          fee_rate: number;
          terminal: 'sumup_w' | 'sumup_r' | 'sumup_h' | 'laranjinha_h' | 'c6_r' | 'pague_veloz' | 'mercado_pago_r' | 'pagbank_h';
          card_brand: 'master' | 'visa' | 'elo' | 'amex' | 'hiper';
          card_last_four: string;
          card_holder_name: string | null;
          seller_id: string;
          sale_type: 'venda_nova' | 'casa';
          payment_method: 'especie' | 'pix' | 'tec' | 'pix_especie';
          payment_account: string | null;
          receipt_url: string | null;
          document_urls: string[] | null;
          status: 'pendente' | 'pago' | 'cancelado';
          payment_date: string | null;
          commission_calculated: boolean;
          commission_amount: number | null;
          financial_entries_generated: boolean;
          installments: number;
          sale_date: string;
          discount_amount: number;
          saturday_refund: number;
          lacre: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          client_id: string;
          sale_value: number;
          terminal_amount: number;
          fee_rate?: number;
          terminal: 'sumup_w' | 'sumup_r' | 'sumup_h' | 'laranjinha_h' | 'c6_r' | 'pague_veloz' | 'mercado_pago_r' | 'pagbank_h';
          card_brand: 'master' | 'visa' | 'elo' | 'amex' | 'hiper';
          card_last_four: string;
          card_holder_name?: string | null;
          seller_id: string;
          sale_type?: 'venda_nova' | 'casa';
          payment_method: 'especie' | 'pix' | 'tec' | 'pix_especie';
          payment_account?: string | null;
          receipt_url?: string | null;
          document_urls?: string[] | null;
          status?: 'pendente' | 'pago' | 'cancelado';
          payment_date?: string | null;
          commission_calculated?: boolean;
          commission_amount?: number | null;
          financial_entries_generated?: boolean;
          installments?: number;
          sale_date: string;
          discount_amount?: number;
          saturday_refund?: number;
          lacre?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          client_id?: string;
          sale_value?: number;
          terminal_amount?: number;
          fee_rate?: number;
          terminal?: 'sumup_w' | 'sumup_r' | 'sumup_h' | 'laranjinha_h' | 'c6_r' | 'pague_veloz' | 'mercado_pago_r' | 'pagbank_h';
          card_brand?: 'master' | 'visa' | 'elo' | 'amex' | 'hiper';
          card_last_four?: string;
          card_holder_name?: string | null;
          seller_id?: string;
          sale_type?: 'venda_nova' | 'casa';
          payment_method?: 'especie' | 'pix' | 'tec' | 'pix_especie';
          payment_account?: string | null;
          receipt_url?: string | null;
          document_urls?: string[] | null;
          status?: 'pendente' | 'pago' | 'cancelado';
          payment_date?: string | null;
          commission_calculated?: boolean;
          commission_amount?: number | null;
          financial_entries_generated?: boolean;
          installments?: number;
          sale_date?: string;
          discount_amount?: number;
          saturday_refund?: number;
          lacre?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      sales_d_plus_products: {
        Row: {
          id: string;
          branch_id: string;
          client_id: string;
          proposal_number: string;
          contract_value: number;
          table_info: string | null;
          bank_info: string | null;
          seller_id: string;
          status: 'pendente' | 'ativo' | 'cancelado';
          financial_entries_generated: boolean;
          payment_method: string | null;
          payment_info: string | null;
          document_urls: string[] | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          client_id: string;
          proposal_number: string;
          contract_value: number;
          table_info?: string | null;
          bank_info?: string | null;
          seller_id: string;
          status?: 'pendente' | 'ativo' | 'cancelado';
          financial_entries_generated?: boolean;
          payment_method?: string | null;
          payment_info?: string | null;
          document_urls?: string[] | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          client_id?: string;
          proposal_number?: string;
          contract_value?: number;
          table_info?: string | null;
          bank_info?: string | null;
          seller_id?: string;
          status?: 'pendente' | 'ativo' | 'cancelado';
          financial_entries_generated?: boolean;
          payment_method?: string | null;
          payment_info?: string | null;
          document_urls?: string[] | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      favorecido_tipo: FavorecidoTipo;
      entry_type: EntryType;
      entry_status: EntryStatus;
      contract_status: ContractStatus;
      reconciliation_status: ReconciliationStatus;
      recurrence_type: RecurrenceType;
      bank_account_type: BankAccountType;
      pix_key_type: PixKeyType;
      payment_type: PaymentType;
      agenda_event_type: AgendaEventType;
      agenda_recurrence_type: AgendaRecurrenceType;
    };
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];
export type UserBranchAccess = Database['public']['Tables']['user_branch_access']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Subcategory = Database['public']['Tables']['subcategories']['Row'];
export type Favorecido = Database['public']['Tables']['favorecidos']['Row'];
export type BankAccount = Database['public']['Tables']['bank_accounts']['Row'];
export type FinancialEntry = Database['public']['Tables']['financial_entries']['Row'];
export type BankStatement = Database['public']['Tables']['bank_statements']['Row'];
export type Reconciliation = Database['public']['Tables']['reconciliations']['Row'];
export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractFile = Database['public']['Tables']['contract_files']['Row'];
export type BudgetItem = Database['public']['Tables']['budget_items']['Row'];
export type SalesTarget = Database['public']['Tables']['sales_targets']['Row'];
export type FavorecidoDocument = Database['public']['Tables']['favorecido_documents']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type AgendaEvent = Database['public']['Tables']['agenda_events']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type ProductCategory = Database['public']['Tables']['product_categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Payroll = Database['public']['Tables']['payroll']['Row'];
export type EmployeeVacation = Database['public']['Tables']['employee_vacations']['Row'];
export type OccupationalExam = Database['public']['Tables']['occupational_exams']['Row'];
export type VtRecharge = Database['public']['Tables']['vt_recharges']['Row'];
export type CorporateHoliday = Database['public']['Tables']['corporate_holidays']['Row'];
export type MedicalCertificate = Database['public']['Tables']['medical_certificates']['Row'];
export type HrAlert = Database['public']['Tables']['hr_alerts']['Row'];
export type SalesCreditCard = Database['public']['Tables']['sales_credit_card']['Row'];
export type SalesDPlusProduct = Database['public']['Tables']['sales_d_plus_products']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type BranchInsert = Database['public']['Tables']['branches']['Insert'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type SubcategoryInsert = Database['public']['Tables']['subcategories']['Insert'];
export type FavorecidoInsert = Database['public']['Tables']['favorecidos']['Insert'];
export type BankAccountInsert = Database['public']['Tables']['bank_accounts']['Insert'];
export type FinancialEntryInsert = Database['public']['Tables']['financial_entries']['Insert'];
export type BankStatementInsert = Database['public']['Tables']['bank_statements']['Insert'];
export type ReconciliationInsert = Database['public']['Tables']['reconciliations']['Insert'];
export type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
export type ContractFileInsert = Database['public']['Tables']['contract_files']['Insert'];
export type BudgetItemInsert = Database['public']['Tables']['budget_items']['Insert'];
export type SalesTargetInsert = Database['public']['Tables']['sales_targets']['Insert'];
export type FavorecidoDocumentInsert = Database['public']['Tables']['favorecido_documents']['Insert'];
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];
export type AgendaEventInsert = Database['public']['Tables']['agenda_events']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type ProductCategoryInsert = Database['public']['Tables']['product_categories']['Insert'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type PayrollInsert = Database['public']['Tables']['payroll']['Insert'];
export type EmployeeVacationInsert = Database['public']['Tables']['employee_vacations']['Insert'];
export type OccupationalExamInsert = Database['public']['Tables']['occupational_exams']['Insert'];
export type VtRechargeInsert = Database['public']['Tables']['vt_recharges']['Insert'];
export type CorporateHolidayInsert = Database['public']['Tables']['corporate_holidays']['Insert'];
export type MedicalCertificateInsert = Database['public']['Tables']['medical_certificates']['Insert'];
export type HrAlertInsert = Database['public']['Tables']['hr_alerts']['Insert'];
export type SalesCreditCardInsert = Database['public']['Tables']['sales_credit_card']['Insert'];
export type SalesDPlusProductInsert = Database['public']['Tables']['sales_d_plus_products']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type BranchUpdate = Database['public']['Tables']['branches']['Update'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];
export type SubcategoryUpdate = Database['public']['Tables']['subcategories']['Update'];
export type FavorecidoUpdate = Database['public']['Tables']['favorecidos']['Update'];
export type BankAccountUpdate = Database['public']['Tables']['bank_accounts']['Update'];
export type FinancialEntryUpdate = Database['public']['Tables']['financial_entries']['Update'];
export type BankStatementUpdate = Database['public']['Tables']['bank_statements']['Update'];
export type ContractUpdate = Database['public']['Tables']['contracts']['Update'];
export type BudgetItemUpdate = Database['public']['Tables']['budget_items']['Update'];
export type SalesTargetUpdate = Database['public']['Tables']['sales_targets']['Update'];
export type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update'];
export type AgendaEventUpdate = Database['public']['Tables']['agenda_events']['Update'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
export type ProductCategoryUpdate = Database['public']['Tables']['product_categories']['Update'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
export type PayrollUpdate = Database['public']['Tables']['payroll']['Update'];
export type EmployeeVacationUpdate = Database['public']['Tables']['employee_vacations']['Update'];
export type OccupationalExamUpdate = Database['public']['Tables']['occupational_exams']['Update'];
export type VtRechargeUpdate = Database['public']['Tables']['vt_recharges']['Update'];
export type CorporateHolidayUpdate = Database['public']['Tables']['corporate_holidays']['Update'];
export type MedicalCertificateUpdate = Database['public']['Tables']['medical_certificates']['Update'];
export type HrAlertUpdate = Database['public']['Tables']['hr_alerts']['Update'];
export type SalesCreditCardUpdate = Database['public']['Tables']['sales_credit_card']['Update'];
export type SalesDPlusProductUpdate = Database['public']['Tables']['sales_d_plus_products']['Update'];
