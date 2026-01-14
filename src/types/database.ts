export type UserRole = 'admin' | 'gerente' | 'usuario';
export type FavorecidoTipo = 'cliente' | 'fornecedor' | 'funcionario' | 'ambos';
export type EntryType = 'receita' | 'despesa';
export type EntryStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type ContractStatus = 'ativo' | 'pendente' | 'encerrado';
export type ReconciliationStatus = 'pendente' | 'conciliado' | 'divergente';
export type RecurrenceType = 'diario' | 'semanal' | 'mensal' | 'anual';
export type BankAccountType = 'corrente' | 'poupanca';
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
export type PaymentType = 'pix' | 'ted' | 'boleto' | 'cartao' | 'dinheiro';
export type AgendaEventType = 'lembrete' | 'aniversario' | 'festividade' | 'feriado';
export type AgendaRecurrenceType = 'yearly' | 'monthly' | 'weekly' | 'none';

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
          // Banking info
          bank_name: string | null;
          bank_agency: string | null;
          bank_account: string | null;
          bank_account_type: BankAccountType | null;
          pix_key: string | null;
          pix_key_type: PixKeyType | null;
          preferred_payment_type: PaymentType | null;
          birth_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          // Banking info
          bank_name?: string | null;
          bank_agency?: string | null;
          bank_account?: string | null;
          bank_account_type?: BankAccountType | null;
          pix_key?: string | null;
          pix_key_type?: PixKeyType | null;
          preferred_payment_type?: PaymentType | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
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
          // Banking info
          bank_name?: string | null;
          bank_agency?: string | null;
          bank_account?: string | null;
          bank_account_type?: BankAccountType | null;
          pix_key?: string | null;
          pix_key_type?: PixKeyType | null;
          preferred_payment_type?: PaymentType | null;
          birth_date?: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          title: string;
          favorecido_id?: string | null;
          type: string;
          value: number;
          start_date: string;
          end_date: string;
          status?: ContractStatus;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          title?: string;
          favorecido_id?: string | null;
          type?: string;
          value?: number;
          start_date?: string;
          end_date?: string;
          status?: ContractStatus;
          notes?: string | null;
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
          year: number;
          month: number;
          budgeted_amount: number;
          actual_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          category_id?: string | null;
          year: number;
          month: number;
          budgeted_amount: number;
          actual_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          category_id?: string | null;
          year?: number;
          month?: number;
          budgeted_amount?: number;
          actual_amount?: number;
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
          bonus_rate: number;
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
          bonus_rate?: number;
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
          bonus_rate?: number;
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