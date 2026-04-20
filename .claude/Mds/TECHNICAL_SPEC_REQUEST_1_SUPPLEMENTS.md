# Request 1 — Technical Specification — Supplements & Quick Reference

---

## Data Examples from Client Documents

### Vale Transporte (VT) — April 2026 Example

From WhatsApp image "RELAÇÃO DE VALE TRANSPORTE - ABRIL":

```
EMPLOYEE_NAME              | SALARY/MÊS | QNT DE DIAS | VALOR DIÁRIO | Nº DO CARTÃO    | TOTAL        | DESCONTO NA FOLHA | OBSERVAÇÃO
MARIA ISABEL SANTOS SILVA  | R$ 1.621,00| 24         | R$ 9,00      | 900602088417.. | R$ 216,00    | R$ 97,26         |
FABIOLA CANDIDO            | R$ 1.621,00| 24         | R$ 9,00      | 900402483871.. | R$ 216,00    | R$ 97,26         |
ISAIAS                     | R$ 1.621,00| 24         | R$ 9,00      | 900602082539.. | R$ 216,00    | R$ 97,26         |
THAYZA                     | R$ 1.621,00| 24         | R$ 9,00      | 900602172079.. | R$ 216,00    | R$ 97,26         |
                           |            |            |              |                | TOTAL GERAL  |
                           |            |            |              |                | R$ 864,00    | R$ 291,78        |
```

**Extraction**:
- Valor Diário = R$ 9,00 (daily rate)
- Quantidade de Dias = 24 (working days in April)
- Total VT = 9.00 × 24 = R$ 216,00 per employee
- Desconto na Folha = R$ 97,26 per employee (discounted from payroll)
- Total for 4 employees: R$ 864,00 VT, R$ 291,78 total discount

**Database representation**:
```sql
INSERT INTO vt_recharges (employee_id, branch_id, recharge_amount, recharge_date, created_at)
VALUES
  ('maria-uuid', 'branch-uuid', 216.00, '2026-04-30', now()),
  ('fabiola-uuid', 'branch-uuid', 216.00, '2026-04-30', now()),
  -- ... etc
```

**Payroll deduction mapping**:
- `payroll.vt_amount = 216.00`
- `payroll.other_discounts += 97.26` (or separate line item if supported)

---

### Férias (Vacation) — 2026 Example

From WhatsApp image "FÉRIAS 2026":

Table structure (sample rows):

```
FUNCIONÁRIO              | ADMISSÃO    | PERÍODO FÉRIAS VENCIDAS | VENCIMENTO | MÁXIMO PARA CONCESSÃO | PERÍODO DE GOZO | STATUS
ABUDA GONÇALVES         | [date]      | [date range]            | [date]     | [date]               | [date range]    | Programada
ADENILSON JOSÉ SANTOS   | [date]      | [date range]            | [date]     | [date]               | [date range]    | Concluída
...                     | ...         | ...                     | ...        | ...                  | ...             | ...
```

**Key fields**:
- ADMISSÃO = admission_date (e.g., 2015-03-10)
- PERÍODO FÉRIAS VENCIDAS = last_vacation_period_end (e.g., 2025-01-30)
- VENCIMENTO = vacation_expiry_date (e.g., 2026-01-30, or 12 months after last period)
- MÁXIMO PARA CONCESSÃO = max_grant_deadline (e.g., 2026-01-30 + 30 days = 2026-02-28)
- PERÍODO DE GOZO = vacation_start_date .. vacation_end_date (e.g., 2026-02-10 to 2026-02-20)
- STATUS = status (Pendente, Programada, Em andamento, Concluída)

**Database representation**:
```sql
INSERT INTO employee_vacations (
  employee_id, branch_id, admission_date, last_vacation_period_end,
  vacation_expiry_date, max_grant_deadline, vacation_start_date, 
  vacation_end_date, status
) VALUES (
  'abuda-uuid', 'branch-uuid', '2015-03-10', '2025-01-30',
  '2026-01-30', '2026-02-28', '2026-02-10', '2026-02-20', 'Programada'
);
```

---

### Atestados (Medical Certificates) — March 2026 Example

From WhatsApp image "RELAÇÃO ATESTADOS 2026":

```
FUNCIONÁRIO           | DATA       | QUANT. DIAS | OBSERVAÇÃO
MICHELINE SOARES      | 24/02/2026 | 1           | ATESTADO
LUANA APARECIDA       | 03/03/2026 | 2           | ATESTADO
JOELMA JOSEFA         | 04/03/2026 | 5           | ATESTADO
PABLO                 | 12/03/2026 | 1           | DECLARAÇÃO
ISAIAS                | 16/03/2026 | 2           | ATESTADO
LAYA                  | 24/03/2026 | 1           | ATESTADO
LAYSA                 | 25/03/2026 | 4           | ATESTADO
MICHELINE SOARES      | 25/03/2026 | 1           | ATESTADO
LUANA APARECIDA       | 30/03/2026 | 1           | ATESTADO
```

**Database representation**:
```sql
INSERT INTO medical_certificates (
  employee_id, branch_id, certificate_date, absence_days, certificate_type
) VALUES
  ('micheline-uuid', 'branch-uuid', '2026-02-24', 1, 'atestado'),
  ('luana-uuid', 'branch-uuid', '2026-03-03', 2, 'atestado'),
  ('joelma-uuid', 'branch-uuid', '2026-03-04', 5, 'atestado'),
  ('pablo-uuid', 'branch-uuid', '2026-03-12', 1, 'declaracao'),
  -- ... etc
;
```

**Report aggregation** (March 2026):
```
FUNCIONÁRIO        | TOTAL DIAS | CONTAGEM
MICHELINE SOARES   | 2          | 2 records
LUANA APARECIDA    | 3          | 2 records
JOELMA JOSEFA      | 5          | 1 record
PABLO              | 1          | 1 record
ISAIAS             | 2          | 1 record
LAYA               | 1          | 1 record
LAYSA              | 4          | 1 record
---
TOTAL MÊS          | 18 dias    | 9 records
```

---

## Screen Flow Mockups (Textual)

### HR Module — Vacation Management Flow

```
┌─────────────────────────────────────────────────────┐
│ HR Dashboard                                        │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ FÉRIAS PRÓXIMAS DO VENCIMENTO        5 employees│ │
│ │ FÉRIAS EM ANDAMENTO                  3 employees│ │
│ │ EXAMES VENCENDO                      2 exams    │ │
│ │ ANIVERSARIANTES DO MÊS               8 people   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [View Full Reports]  [Download Excel]              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Férias (Vacations) Page                             │
├─────────────────────────────────────────────────────┤
│ Filters:                                            │
│ [Search by name...]  [Unit: ─────]  [Month: ───] │
│ [Status: ───────────────────────]                 │
│                                                     │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Name    │ Admission │ Expiry    │ Status  │ Dates│ │
│ ├─────────┼───────────┼───────────┼─────────┼─────┤ │
│ │ Abuda   │ 15/03/15  │ 30/01/26  │ Prog.   │[...] │ │
│ │ Adenil  │ 20/05/18  │ 15/05/26  │ Concl.  │[...] │ │
│ │ ...     │ ...       │ ...       │ ...     │ ... │ │
│ └──────────────────────────────────────────────────┘ │
│                                                     │
│ [+ Add Vacation]  [Export Report]                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Modal: Add/Edit Vacation                            │
├─────────────────────────────────────────────────────┤
│ Employee:            [Abuda Gonçalves ▼]           │
│                      (search by name, CPF)          │
│                                                     │
│ Admission Date:      [15/03/2015]                  │
│ Last Vacation End:   [30/01/2025]                  │
│ Vacation Expiry:     [30/01/2026]                  │
│ Max Grant Deadline:  [28/02/2026]                  │
│                                                     │
│ Vacation Start:      [10/02/2026]                  │
│ Vacation End:        [20/02/2026]                  │
│ Status:              ◯ Pendente  ◯ Programada      │
│                      ◯ Em andamento  ◯ Concluída    │
│                                                     │
│ Notes:               [textarea]                    │
│                                                     │
│                           [Save]  [Cancel]         │
└─────────────────────────────────────────────────────┘
```

### Sales Module — Credit Card Sale Flow

```
┌────────────────────────────────────────────────────┐
│ Vendas (Sales) Dashboard                           │
├────────────────────────────────────────────────────┤
│ [+ NOVA VENDA ▼]                                   │
│   ├─ Cartão de Crédito                            │
│   └─ D+ Produtos                                  │
│                                                   │
│ Filters:                                           │
│ [Date range]  [Client]  [Seller]  [Terminal] [..] │
│                                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Data  │ Cliente    │ Tipo  │ Valor │ Vendedor│ S│ │
│ ├───────┼────────────┼───────┼───────┼─────────┤ │ │
│ │ 11/04 │ João Silva │ CC    │ 1000  │ Rafa    │P│ │
│ │ 10/04 │ Maria J.   │ D+    │ 5000  │ Carlos  │P│ │
│ │ 09/04 │ Pedro P.   │ CC    │ 1500  │ Rafa    │P│ │
│ └─────────────────────────────────────────────────┘ │
│                                                   │
│ [View Reports]  [Export]                          │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Modal: Venda Cartão de Crédito                     │
├────────────────────────────────────────────────────┤
│ 1. CLIENTE                                         │
│    [Search by name, CPF, phone...]                │
│    Selected: João da Silva | CPF: 123.456.789-00 │
│                                                   │
│ 2. VALORES                                         │
│    Valor da venda:      [1.000,00]                │
│    Valor da maquineta:  [1.200,00]                │
│    Taxa aplicada:       [20%] (auto-calculated)   │
│                                                   │
│ 3. TERMINAL E CARTÃO                              │
│    Maquineta:      [Sumup W ▼]                    │
│    Bandeira:       [VISA ▼]                       │
│    Final cartão:   [1234]                         │
│    Titular:        [João da Silva]                │
│                                                   │
│ 4. VENDEDOR                                        │
│    [Rafael Silva ▼] (search)                      │
│    Tipo: ◯ Venda nova  ◯ Casa                     │
│                                                   │
│ 5. PAGAMENTO                                       │
│    Forma: ◯ Espécie  ◯ PIX  ◯ TEC  ◯ PIX|Espécie │
│    (PIX selected) Conta: [TF RENTA ▼]             │
│                                                   │
│ 6. DOCUMENTOS                                      │
│    [Upload files] (PDF, images)                   │
│    ✓ boleta_scanada.pdf                          │
│                                                   │
│ 7. RECIBO                                          │
│    [Gerar Recibo] → shows preview in modal        │
│                                                   │
│                  [Salvar]  [Cancelar]             │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Recibo (Receipt) Preview                           │
├────────────────────────────────────────────────────┤
│ LIVRECRED — NOTA DE VENDA                          │
│ ─────────────────────────────────────────────────  │
│ Data: 11/04/2026 | Vendedor: Rafael Silva        │
│ Cliente: João da Silva                            │
│                                                   │
│ Cartão: VISA **1234 | Terminal: Sumup W          │
│                                                   │
│ Valor da venda:      R$ 1.000,00                  │
│ Taxa (20%):          R$ 200,00                    │
│ Valor da maquineta:  R$ 1.200,00                  │
│                                                   │
│ Forma de pagamento: PIX (Conta TF RENTA)          │
│                                                   │
│ ─────────────────────────────────────────────────  │
│           Assinado por: [system signature]        │
│                                                   │
│            [Imprimir]  [Salvar PDF]  [Fechar]    │
└────────────────────────────────────────────────────┘
```

---

## API Integration Points

### Supabase RLS Setup Example

```sql
-- Enable RLS on new tables
ALTER TABLE employee_vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_credit_card ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Example policy: User can see vacations from their branch(es)
CREATE POLICY "Users can view vacations from accessible branches"
  ON employee_vacations FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
    )
  );

-- Example policy: Only HR/Admin can create vacations
CREATE POLICY "Only HR or admins can create vacations"
  ON employee_vacations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'financeiro')
    )
    OR
    EXISTS (
      SELECT 1 FROM user_branch_access 
      WHERE user_id = auth.uid() 
      AND branch_id = NEW.branch_id
    )
  );

-- Example policy for sales: Seller can see own sales
CREATE POLICY "Users can view sales from accessible branches"
  ON sales_credit_card FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
    )
  );
```

---

## Configuration & Constants

### Payment Methods & Terminals

```typescript
// src/constants/sales.ts

export const PAYMENT_METHODS = {
  ESPECIE: 'especie',
  PIX: 'pix',
  TEC: 'tec',
  PIX_ESPECIE: 'pix_especie',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  especie: 'Espécie (Dinheiro)',
  pix: 'PIX',
  tec: 'TEC (Transferência)',
  pix_especie: 'PIX | Espécie',
};

export const TERMINALS = {
  SUMUP_W: 'sumup_w',
  SUMUP_R: 'sumup_r',
  SUMUP_H: 'sumup_h',
  LARANJINHA_H: 'laranjinha_h',
  C6_R: 'c6_r',
  PAGUE_VELOZ: 'pague_veloz',
  MERCADO_PAGO_R: 'mercado_pago_r',
  PAGBANK_H: 'pagbank_h',
} as const;

export const TERMINAL_LABELS: Record<string, string> = {
  sumup_w: 'Sumup W',
  sumup_r: 'Sumup R',
  sumup_h: 'Sumup H',
  laranjinha_h: 'Laranjinha H',
  c6_r: 'C6 R',
  pague_veloz: 'Pague Veloz',
  mercado_pago_r: 'Mercado Pago R',
  pagbank_h: 'Pagbank H',
};

export const CARD_BRANDS = {
  MASTER: 'master',
  VISA: 'visa',
  ELO: 'elo',
  AMEX: 'amex',
  HIPER: 'hiper',
} as const;

export const CARD_BRAND_LABELS: Record<string, string> = {
  master: 'Mastercard',
  visa: 'Visa',
  elo: 'Elo',
  amex: 'American Express',
  hiper: 'Hipercard',
};

export const TRANSFER_SOURCES = {
  TF_CENTRAL: 'tf_central',
  TF_RENTA: 'tf_renta',
  TF_RALF: 'tf_ralf',
} as const;

export const TRANSFER_SOURCE_LABELS: Record<string, string> = {
  tf_central: 'TF CENTRAL',
  tf_renta: 'TF RENTA',
  tf_ralf: 'TF RALF',
};
```

### Vacation Statuses

```typescript
// src/constants/hr.ts

export const VACATION_STATUSES = {
  PENDENTE: 'pendente',
  PROGRAMADA: 'programada',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
} as const;

export const VACATION_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  programada: 'Programada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
};

export const VACATION_STATUS_COLORS: Record<string, string> = {
  pendente: 'yellow',
  programada: 'blue',
  em_andamento: 'green',
  concluida: 'gray',
};

export const EXAM_TYPES = {
  ADMISSIONAL: 'admissional',
  PERIODICO: 'periodico',
  DEMISSIONAL: 'demissional',
} as const;

export const EXAM_TYPE_LABELS: Record<string, string> = {
  admissional: 'Admissional',
  periodico: 'Periódico',
  demissional: 'Demissional',
};

export const CERTIFICATE_TYPES = {
  ATESTADO: 'atestado',
  DECLARACAO: 'declaracao',
} as const;

export const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
  atestado: 'Atestado',
  declaracao: 'Declaração',
};

export const HOLIDAY_TYPES = {
  NACIONAL: 'nacional',
  ESTADUAL: 'estadual',
  MUNICIPAL: 'municipal',
} as const;

export const HOLIDAY_TYPE_LABELS: Record<string, string> = {
  nacional: 'Feriado Nacional',
  estadual: 'Feriado Estadual',
  municipal: 'Feriado Municipal',
};

export const ALERT_TYPES = {
  VACATION_EXPIRING: 'vacation_expiring',
  VACATION_EXPIRED: 'vacation_expired',
  VACATION_UNSCHEDULED: 'vacation_unscheduled',
  EXAM_EXPIRING: 'exam_expiring',
  EXAM_EXPIRED: 'exam_expired',
  BIRTHDAY_UPCOMING: 'birthday_upcoming',
  BIRTHDAY_TODAY: 'birthday_today',
} as const;

export const ALERT_PRIORITY: Record<string, number> = {
  vacation_expired: 1,
  vacation_expiring: 2,
  exam_expired: 3,
  exam_expiring: 4,
  vacation_unscheduled: 5,
  birthday_today: 6,
  birthday_upcoming: 7,
};
```

---

## Import/Export Specifications

### Vacation Export (Excel)

**Sheet**: "Férias 2026"

Columns:
- A: Funcionário (employee name)
- B: Admissão (admission date, formatted as DD/MM/YYYY)
- C: Período férias vencidas (last vacation period, e.g., "15/01/2025 - 25/01/2025")
- D: Vencimento (expiry date, DD/MM/YYYY)
- E: Máximo para concessão (max deadline, DD/MM/YYYY)
- F: Período de gozo (vacation dates, e.g., "10/02/2026 - 20/02/2026")
- G: Status (Pendente, Programada, Em andamento, Concluída)
- H: Observação (notes)

Example rows:
```
Funcionário | Admissão | Período férias vencidas | Vencimento | Máximo para concessão | Período de gozo | Status      | Observação
Abuda G.    | 15/03/15 | 15/01/25 - 25/01/25    | 30/01/26   | 28/02/26             | 10/02/26-20/02  | Programada  |
```

### VT Report Export (Excel)

**Sheet**: "Vale Transporte - Abril"

Columns:
- A: Nome (employee name)
- B: Salário/Mês (monthly salary)
- C: Qnt de dias (working days)
- D: Valor diário (daily rate)
- E: Nº do cartão (card number)
- F: Total (total VT amount)
- G: Desconto na folha (payroll deduction)
- H: Observação (notes)

Summary rows at end:
```
TOTAL GERAL | | | | | R$ 864,00 | R$ 291,78 |
```

### Sales Report Export (Excel)

**Sheet 1**: "Resumo"

Key cards:
```
Soma das maquinetas:     R$ [sum of terminal amounts]
Total de empréstimo:     R$ [sum of D+ contract values]
Total de vendas:         R$ [sum of sale values]
Total de saídas:         R$ [sum of discounts/refunds]
Valor devolução sábado:  R$ [Saturday returns]
Total final:             R$ [net]
```

**Sheet 2**: "Detalhamento por Maquineta"

Columns: Terminal | Contagem | Valor | %

**Sheet 3**: "Detalhamento por Método"

Columns: Método | Contagem | Valor | %

**Sheet 4**: "Detalhamento por Vendedor"

Columns: Vendedor | Contagem | Valor | Comissão | Status

---

## Glossary of Portuguese Business Terms

| Portuguese Term        | English              | Context                                       |
|------------------------|----------------------|-----------------------------------------------|
| Férias                 | Vacation/Holiday     | Paid time off, 30 days/year in Brazil        |
| Vencimento             | Expiry/Due date      | Date vacation right expires                  |
| Período de gozo        | Vacation period      | Dates employee is on vacation                |
| Status (férias)        | Vacation status      | Pendente, Programada, Em andamento, Concluída|
| Exame ocupacional      | Occupational exam    | Health/safety exam (ADM, periodic, EOD)     |
| Atestado               | Medical certificate  | Doctor's note for absence                   |
| Declaração             | Declaration          | Formal statement (similar to atestado)       |
| Vale Transporte (VT)   | Transport allowance  | Daily bus/transit subsidy, deducted from pay|
| Folha de Pagamento     | Payroll              | Monthly salary processing                   |
| Maquineta              | Payment terminal      | Card reader device (POS)                    |
| Bandeira               | Card brand/flag      | VISA, Mastercard, Elo, Amex, Hipercard     |
| PIX                    | Instant bank transfer| Brazilian real-time payment system          |
| TEC                    | Electronic transfer  | Account-to-account transfer                 |
| Espécie                | Cash                 | Physical money                              |
| Recibo                 | Receipt              | Sales invoice/receipt                       |
| Lacre                  | Seal                 | Audit/integrity indicator                   |
| Tabela                 | Table/Terms          | Loan/product terms (user-entered)           |
| Unidade                | Branch/Location      | Physical office/store location              |
| Favorecido             | Payee/Stakeholder    | Client, supplier, or employee               |
| Funcionário            | Employee             | Staff member                                |
| Cliente                | Client/Customer      | Business customer                           |
| Fornecedor             | Supplier             | Vendor                                      |
| Gerente                | Manager              | Branch manager or supervisor                |
| Coordenador            | Coordinator          | Team lead or unit coordinator               |
| Assistente             | Assistant            | Administrative support staff                |
| Vendedor               | Salesperson/Seller   | Sales representative                        |
| Segurança              | Security/Guard       | Security personnel                          |
| Financeiro             | Finance              | Finance/Accounting team/role                |
| Recursos Humanos (RH)  | Human Resources (HR) | HR department                               |
| Leitura                | Read-only            | View-only access                            |
| Administrador          | Administrator        | System admin with full access               |
| DRE                    | Income statement     | Demonstração de Resultado (P&L report)     |
| Conciliação            | Reconciliation       | Bank account matching                       |
| Orçamento              | Budget               | Financial forecast/planning                 |
| Receita                | Income/Revenue       | Money coming in                             |
| Despesa                | Expense              | Money going out                             |
| Comissão               | Commission           | Sales incentive payment                     |
| Meta                   | Target/Goal          | Sales quota or objective                    |
| Cartão de Crédito      | Credit card          | Credit/payment card                         |
| D+ Produtos            | D+ Products          | Specific loan/product category (client has this)

---

## Implementation Priority Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [x] Database schema: Create new tables (employee_vacations, occupational_exams, vt_recharges, corporate_holidays, medical_certificates, hr_alerts)
- [x] Database schema: Create sales tables (sales_credit_card, sales_d_plus_products)
- [x] Supabase RLS policies for multi-tenant security
- [x] Update database.ts types with new tables
- [x] Create basic services (getEmployeeVacations, getOccupationalExams, etc.)

### Phase 2: HR Core Modules (Weeks 2-3)

- [ ] Vacation page: List, filter, CRUD modal
- [ ] Exams page: List, filter, CRUD modal with document upload
- [ ] VT tracking page: List recharges, monthly report generation
- [ ] Corporate calendar: Holiday management
- [ ] Medical certificates: List, filter, CRUD modal
- [ ] Create hooks for each HR module (useEmployeeVacations, etc.)

### Phase 3: HR Alerting & Dashboard (Week 4)

- [ ] HrAlertPanel component (global notification panel)
- [ ] Alert generation logic (generateHrAlerts service)
- [ ] HR Dashboard with KPI cards
- [ ] Alert filtering & dismissal logic

### Phase 4: Sales System (Weeks 4-5)

- [ ] Refactor Contratos page into Sales module
- [ ] Credit card sale form with all required fields
- [ ] D+ products form
- [ ] Receipt generation template & modal
- [ ] Sales list/table view with filters
- [ ] Create hooks for sales (useCreateCreditCardSale, etc.)

### Phase 5: Sales Reporting (Week 6)

- [ ] Sales dashboard with summary cards
- [ ] Aggregation queries (by terminal, by method, by seller)
- [ ] Report generation and Excel export
- [ ] Commission calculation integration

### Phase 6: Testing & Refinement (Week 7)

- [ ] User testing & feedback collection
- [ ] Bug fixes and refinements
- [ ] Performance optimization (query indexes, query caching)
- [ ] Documentation & user guides

**Total Estimated Effort**: 7-8 weeks for full implementation

---

## Common Pitfalls & Solutions

### HR Module

1. **Vacation date overlap**: Prevent an employee from having overlapping vacation periods.
   - *Solution*: Add validation in service: `checkVacationOverlap(employeeId, startDate, endDate)`

2. **Alert fatigue**: Too many alerts cause user to ignore them.
   - *Solution*: Prioritize alerts (critical > warning > info). Group by employee/type. Allow user to set alert preferences.

3. **Exam expiry miscalculation**: Date math is error-prone (leap years, day count).
   - *Solution*: Use library like `date-fns` or `dayjs` for date calculations. Test thoroughly.

4. **VT calculation with varying daily rates**: If daily rate changes mid-month.
   - *Solution*: Store daily_rate per recharge record, not globally. Calculate: sum(daily_rate × days) per employee.

### Sales Module

5. **Commission double-counting**: Commission calculated on sale AND payment.
   - *Solution*: Store commission state (calculated: bool) to prevent recalculation. Only calculate on sale creation (not on payment).

6. **Terminal/payment method compatibility**: Some terminals don't support all methods.
   - *Solution*: Create a compatibility matrix (table or config) and validate on form submission.

7. **Receipt duplication**: Receipt generated multiple times, PDFs not deduped.
   - *Solution*: Generate receipt once on save. Store URL in database. Retrieve and display on subsequent views.

8. **Fee calculation precision**: Floating-point errors (e.g., 0.20 * 1000 = 199.99999).
   - *Solution*: Use `decimal.js` or numeric library. Store as integers (cents) if possible.

9. **Access control bypasses**: RLS policies not enforced, user can see/edit other branches' sales.
   - *Solution*: Test RLS thoroughly. Enforce in both Supabase (backend) and frontend (hooks). Never trust client-side filtering alone.

10. **Report performance**: Aggregation queries slow on large datasets.
    - *Solution*: Add database indexes on (branch_id, created_at). Use pagination. Limit date range (e.g., last 30 days by default).

---

**End of Supplements**
