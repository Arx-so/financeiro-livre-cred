# Request 1 — HR Module & Sales Refactor — Technical Specification

**Version**: 1.0  
**Date**: 2026-04-11  
**Status**: Ready for Development (Pending clarifications noted)

---

## Source Documents Analyzed

1. `CHECKLIST - rh.docx` — HR/RH module comprehensive checklist
2. `Detalhamento relatório vendas 2026.docx` — Sales system details and payment flows
3. `RELATÓRIO DE VENDAS 2026.xlsx` — Sales data example
4. `Folha 03_2026.xlsx` — Payroll (Folha) March 2026 data example
5. `WhatsApp Image 2026-04-11 at 11.33.49.jpeg` — Férias 2026 planning spreadsheet
6. `WhatsApp Image 2026-04-11 at 11.33.49 (1).jpeg` — Vale Transporte (VT) April 2026 with discount calculation
7. `WhatsApp Image 2026-04-11 at 11.33.49 (2).jpeg` — Atestados (Medical certificates) 2026

---

## Executive Summary

This request consists of **two major initiatives**:

1. **HR Module (Módulo RH)** — A comprehensive HR management system covering:
   - Férias (Vacation) management with automatic alerts and programming
   - Exames Ocupacionais (Occupational exams) tracking with document upload
   - Vale Transporte (VT/Transportation allowance) management and monthly reporting
   - Calendário Corporativo (Corporate calendar) with holidays and integration points
   - Aniversários (Birthdays) tracking with notifications
   - Relação de Atestados (Medical certificate register)
   - HR Dashboard with KPIs
   - Global alerting system (30-day notifications for exams/vacation, day-of for birthdays)

2. **Sales System Refactor (Sistema de Vendas)** — Transforming the existing "Contratos" module to a point-of-sale system for:
   - Credit card (Cartão de Crédito) sales with multiple payment terminals, card brands, and seller tracking
   - D+ Products (Produtos D+) registration (loans and similar products)
   - Payment flow management (cash, PIX, TEC transfers from specific accounts)
   - Sales receipts generation
   - Commission tracking and calculation
   - Sales reports with breakdown by payment method, discounts, and terminal

---

## Business Context & Objectives

### HR Module Context

**Problem**: Employee HR data is currently managed in Excel/external systems. The client needs:
- Centralized tracking of vacation entitlements and scheduling
- Compliance with Brazilian labor law (mandatory occupational exams, holiday tracking)
- Automated alerts to prevent legal exposure (unpaid vacation, expired exams)
- Visibility into HR metrics for management (who's on vacation, upcoming exams, absences)

**Expected Users**: HR managers, branch coordinators, finance team
**Key Metrics**: Vacation days remaining, exam expiry status, absence tracking, birthday recognition

### Sales System Context

**Problem**: Current "Contratos" module is for service contracts, not point-of-sale transactions. Client needs:
- Fast credit card sale registration with terminal selection and card brand tracking
- D+ product registration (loans, consigned credit, etc.) with contract details
- Payment method flexibility (cash, PIX, TEC transfers)
- Commission calculation based on sales
- Seller/team attribution (new sale vs house sale distinction)
- Ability to generate receipts for customers
- Sales reports by terminal, method, and seller

**Expected Users**: Sales team, security, coordinators, finance
**Key Metrics**: Sales volume by terminal, payment method breakdown, discounts applied, commission accrual

---

## Functional Requirements

### HR Module — Férias (Vacation)

🔴 **Critical**

- **FR-HR-001**: Create vacation registry per employee with the following fields:
  - Data de Admissão (Admission date)
  - Último período de férias vencidas (Last expired vacation period)
  - Data de vencimento das férias (Vacation expiry date)
  - Prazo máximo para concessão (Max. time to grant vacation)
  - Período de gozo (Vacation start/end dates)
  - Status das férias (Pendente | Programada | Em andamento | Concluída)

- **FR-HR-002**: Allow editing and updating vacation periods (admission date, expiry date, status)

- **FR-HR-003**: Display vacation data by unit (Unidade/branch):
  - View all employees' vacation status filtered by branch
  - Show employee name, admission date, vacation dates, status

- **FR-HR-004**: Create annual vacation programming screen:
  - Calendar-based view showing vacation slots
  - Ability to assign employees to vacation periods
  - Visual indication of status (pending, scheduled, in progress, completed)

- **FR-HR-005**: Implement filters for vacation data:
  - By employee name (text search)
  - By unit/branch (dropdown)
  - By month (vacation month)
  - By status (select one or multiple)

- **FR-HR-006**: Automatic alerts:
  - 30-day before vacation expiry: "Férias vencendo" alert
  - For unprogrammed vacation: "Férias não programadas" alert
  - For expired vacation: "Férias vencidas" alert
  - Display in global alert panel and optionally in dashboard

### HR Module — Exames Ocupacionais (Occupational Exams)

🔴 **Critical**

- **FR-HR-007**: Create occupational exam registry per employee:
  - Tipo de exame (Admissional | Periódico | Demissional)
  - Data de realização (Exam date)
  - Data de validade (Expiry date — required for Periódico)
  - Document attachment (PDF/image)

- **FR-HR-008**: Support document upload/attachment for each exam:
  - Accept PDF and image formats
  - Store file reference and retrieve it later

- **FR-HR-009**: Display exam history by employee:
  - List all exams (admissional, periodic, demissional) in chronological order
  - Show exam type, date, expiry date, document link

- **FR-HR-010**: Automatic alerts:
  - 30-day before exam expiry: "Exame vencendo" alert
  - For expired exam: "Exame vencido" alert
  - Display in global alert panel

### HR Module — Vale Transporte (Transportation Allowance)

🟡 **Important**

- **FR-HR-011**: Track transportation allowance (Vale Transporte/VT) recharges per employee:
  - Employee reference
  - Valor da recarga (Recharge amount in R$)
  - Data da recarga (Recharge date)
  - Historical log of all recharges

- **FR-HR-012**: Generate monthly VT report:
  - List employees with VT recharges
  - Total VT amount recharged per employee and in aggregate
  - Filter by month and unit
  - Show discounts/deductions applied (from payroll integration)
  - Export to Excel/PDF

- **FR-HR-013**: Calculate VT discount on payroll:
  - Extract from the example: Valor Diário (daily amount, e.g., R$ 9.00)
  - Quantidade de Dias (working days, e.g., 24)
  - Total VT = Daily value × working days (e.g., R$ 216.00)
  - Desconto na Folha (deduction from payroll)
  - This is already partially in payroll but may need explicit VT tracking

### HR Module — Calendário Corporativo (Corporate Calendar)

🟡 **Important**

- **FR-HR-014**: Manual holiday registration:
  - Campo: Data (date)
  - Campo: Descrição (description)
  - Campo: Tipo (Nacional | Estadual | Municipal)
  - Allow CRUD operations

- **FR-HR-015**: Display holidays in calendar view:
  - Visual calendar with marked holidays
  - Show holiday details on hover/click

- **FR-HR-016**: Integrate calendar with Férias and Aniversários:
  - Show vacation periods overlaid on calendar
  - Show birthday employees overlaid on calendar
  - Context-sensitive filtering

### HR Module — Aniversários (Birthdays)

🟡 **Important**

- **FR-HR-017**: Track employee and client birthdays:
  - Data de nascimento (Birth date) already in favorecidos table
  - Classification: Funcionário (employee) | Cliente (client)
  - Support both employee and client birthday tracking

- **FR-HR-018**: Display monthly birthday listing:
  - Filter by month
  - Show name, role (employee/client), age
  - Highlight in dashboard

- **FR-HR-019**: Birthday notifications:
  - Automatic notification on the day (in-app and/or email)
  - Optional: advanced notice (e.g., 3 days before)

### HR Module — Relação de Atestados (Medical Certificates Register)

🟡 **Important**

- **FR-HR-020**: Create medical certificate registry per employee:
  - Nome do funcionário (Employee name)
  - Data do atestado (Certificate date)
  - Quantidade de dias (Days of absence)
  - Tipo (Atestado | Declaração)
  - Observação (Notes)

- **FR-HR-021**: Display employee attestation history:
  - Chronological list of all certificates
  - Show date, days, type, notes

- **FR-HR-022**: Generate attestation reports:
  - Consolidated view by period (month/quarter/year)
  - Filter by employee, type, period
  - Sum total days per employee
  - Export to Excel/PDF

### HR Module — Dashboard RH (Management View)

🟢 **Nice-to-have** (but client expects it)

- **FR-HR-023**: Create HR dashboard (src/pages/Relatorios/ or new page):
  - Card: "Férias próximas do vencimento" — count/list of expiring vacations
  - Card: "Férias em andamento" — count/list of employees on vacation
  - Card: "Exames vencendo" — count/list of expiring exams
  - Card: "Aniversariantes do mês" — count/list of birthdays this month
  - Card: "Atestados no mês" — count/total days of medical certificates this month
  - Branch selector (if multi-branch view)

### HR Module — Sistema de Alertas (Global Alert System)

🔴 **Critical** (infrastructure)

- **FR-HR-024**: Create global alert panel accessible from navbar/sidebar:
  - Displays alerts from all HR modules
  - 30-day alerts: Férias, Exames
  - Day-of alerts: Aniversários
  - Clear/dismiss alerts
  - Show alert type, date, and employee name
  - Link to relevant record (employee, vacation, exam, etc.)

- **FR-HR-025**: Alert notification infrastructure:
  - Server-side calculation (e.g., query at midnight or on data change)
  - Cache alerts in a table or compute on-demand per user session
  - **Decision needed**: Real-time notifications (WebSocket) or periodic polling?

### HR Module — Relatórios (Reports)

🟢 **Nice-to-have**

- **FR-HR-026**: Generate and export HR reports:
  - Relatório de férias (by period/unit) — Excel/PDF
  - Relatório de exames ocupacionais — Excel/PDF
  - Relatório de atestados — Excel/PDF
  - Relatório de Vale Transporte — Excel/PDF

---

### Sales System — Credit Card Sales

🔴 **Critical**

Note: This refactors the existing "Contratos" module which is currently for service contracts into a point-of-sale system.

- **FR-SALES-001**: Create "Venda" (sale) entry with two types: **Cartão de Crédito** (Credit Card) or **D+ Produtos** (D+ Products)

#### Credit Card (Cartão de Crédito) Sales Form

- **FR-SALES-002**: Credit card sale fields (in order of UI display):
  - Nome do cliente (Client name)
    - Support full client registry lookup
    - Searchable by: name, CPF, phone
    - Linked to favorecidos table (type: cliente)
  - Valor da venda (Sale value, e.g., 1.000,00)
  - Valor da maquineta (Terminal amount, e.g., 1.200,00)
  - Taxa aplicada (Applied fee/markup, e.g., 20% on sale value)
    - Formula: terminal_value = sale_value × (1 + fee_rate)
    - Or: fee = terminal_value - sale_value
  - Maquineta (Payment terminal selection):
    - Options: Sumup W | Sumup R | Sumup H | Laranjinha H | C6 R | Pague Veloz | Mercado Pago R | Pagbank H
  - Bandeira do cartão (Card brand/flag):
    - Options: MASTER | VISA | ELO | AMEX | HIPER
  - Final do cartão (Last 4 digits of card)
  - Nome do titular (Card holder name)
  - Vendedor (Seller/employee):
    - Dropdown linking to funcionário in favorecidos
    - Option: "venda nova" (new sale) or "casa" (house/own sale)
  - Forma pagamento (Payment method):
    - Options: ESPECIE (cash) | PIX | TEC
    - Or combined: PIX | ESPÉCIE | TEC | (PIX | ESPÉCIE)
  - Dados bancários | PIX:
    - If PIX or TEC selected: choose transfer source account
      - TF CENTRAL (Transfer Central)
      - TF RENTA (Transfer Renta)
      - TF RALF (Transfer Ralf)
    - Bank details or PIX key from account registry
  - Foto boleta e documentos (Invoice and document photos)
    - File upload field
    - Accept images/PDFs
    - Multiple files
  - Criar recibo (Generate receipt)
    - Template-based receipt generation
    - Include sale details, terminal, seller, date

- **FR-SALES-003**: Link credit card sales to commissions:
  - Detect seller/vendedor
  - Mark sale with seller_id
  - Commission should be auto-calculated based on product/contract rules
  - Status: pendente | pago (payment of commission to seller)

#### D+ Produtos (D+ Products) Sales Form

- **FR-SALES-004**: D+ Products fields:
  - Nome (Client name — same lookup as credit card)
  - Número proposta (Proposal number)
  - Valor do contrato (Contract value)
  - Tabela (Table — free-form text, "digitável" = user-entered)
  - Banco (Bank — free-form text, user-entered, or dropdown)

### Sales System — Reports

🔴 **Critical**

- **FR-SALES-005**: Generate sales reports with:
  - Soma dos valores das maquinetas (Total terminal amounts)
  - Total de empréstimo (Total loan/contract amount for D+ products)
  - Detalhamento das vendas de cada maquineta (Breakdown by terminal)
  - Saídas (Outflows/expenses)
  - Descontos (Discounts applied)
  - Total de saídas (Total outflows)
  - Total final (Net sales)
  - Valor devolução sábado (Saturday returns/refunds)
  - Lacre (Seal/audit trail indicator)

- **FR-SALES-006**: Report filters and exports:
  - Filter by date range, seller, terminal, payment method
  - Export to Excel/PDF

### Sales System — Access Control

🔴 **Critical**

Note: Refine existing role system to support sales workflow

- **FR-SALES-007**: Role-based access control for sales:
  - Administrador — Full access
  - Gerente — Access to all units, except Financeiro and RH
  - Coordenador — All sales/reports/cadastro for their unit
  - Assistente — Reports, sales, cadastro for their unit
  - Vendedor — Reports, sales, cadastro for their unit
  - Segurança — Reports, sales, cadastro for their unit
  - Financeiro — All financial functions (including commission payment)
  - Recursos Humanos — All HR functions
  - Leitura — Read-only, same as Assistente but no registration

---

## Business Rules

### HR Module — Férias (Vacation)

- **BR-HR-001**: Vacation expiry is calculated from admission date + 12 months (Brazilian law)
- **BR-HR-002**: Vacation status flow: Pendente → Programada → Em andamento → Concluída
- **BR-HR-003**: A vacation cannot be marked "Em andamento" unless status is "Programada"
- **BR-HR-004**: Once "Concluída", a vacation period is historical and read-only
- **BR-HR-005**: An employee can have multiple vacation periods in the same year (30 days total in Brazil)
- **BR-HR-006**: Vacation data must be scoped by branch (branch_id in table)
- **BR-HR-007**: 30-day alert triggers when: (vacation_expiry_date - today) = 30 days
- **BR-HR-008**: Unprogrammed alert triggers when: vacation_expiry_date <= today AND status = Pendente
- **BR-HR-009**: Historical tracking — old vacation records remain in database (is_active or deleted_at pattern)

### HR Module — Exames (Occupational Exams)

- **BR-HR-010**: Admissional exams: no expiry date (one-time)
- **BR-HR-011**: Periódico exams: expiry date is mandatory (typically 12 months from exam_date)
- **BR-HR-012**: Demissional exams: no expiry date (one-time)
- **BR-HR-013**: 30-day alert triggers when: (exam_expiry_date - today) = 30 days AND exam_type = Periódico
- **BR-HR-014**: Alert for expired exam when: exam_expiry_date <= today AND exam_type = Periódico
- **BR-HR-015**: Document upload is mandatory for exam record creation
- **BR-HR-016**: One exam per type per employee (no duplicates in same category)

### HR Module — Vale Transporte (VT)

- **BR-HR-017**: VT is a monthly benefit deducted from payroll
- **BR-HR-018**: Calculation: VT total = daily_rate × working_days_in_month
- **BR-HR-019**: Daily rate should be configurable per branch or employee category
- **BR-HR-020**: VT is optional per employee (some may not receive it)
- **BR-HR-021**: VT deduction appears in payroll as a negative/discount item
- **BR-HR-022**: VT recharge history is immutable (no edits, only new entries)

### HR Module — Calendário Corporativo

- **BR-HR-023**: Holidays are branch-level (same holiday may not apply to all branches in multi-branch setup)
- **BR-HR-024**: If a holiday falls on a vacation day, no double-counting of days off

### HR Module — Aniversários

- **BR-HR-025**: Birthday is extracted from favorecidos.birth_date
- **BR-HR-026**: Classification determines notification scope (employee vs client)
- **BR-HR-027**: Same person can appear as both employee and client (different favorecido records or flag)

### HR Module — Atestados (Medical Certificates)

- **BR-HR-028**: Atestado records are immutable (created once, not edited)
- **BR-HR-029**: Quantidade de dias should reflect working days absent (not calendar days)
- **BR-HR-030**: Tipo affects payroll deduction rules (Atestado may be paid/unpaid based on policy)

### HR Module — Global Alerting

- **BR-HR-031**: Alerts are user/role-scoped (Gerente sees alerts for all units; Coordenador sees only their unit)
- **BR-HR-032**: Alert priority: Férias vencidas > Férias vencendo > Férias não programadas
- **BR-HR-033**: Dismissed alerts can be re-shown (no permanent dismissal; reset daily)
- **BR-HR-034**: Alerts are real-time or computed on-demand (no persistent "alert read" status required initially)

### Sales System — Credit Card Sales

- **BR-SALES-001**: Sale value must be numeric, positive, and non-zero
- **BR-SALES-002**: Maquineta value must be ≥ Sale value (terminal amount includes fee)
- **BR-SALES-003**: Fee rate should be pre-calculated: (Maquineta - Sale) / Sale
- **BR-SALES-004**: Sale must link to a valid client (favorecido with type=cliente or ambos)
- **BR-SALES-005**: Seller must be a valid funcionário (favorecido with type=funcionario or ambos)
- **BR-SALES-006**: Card final digits should validate (4 numeric digits)
- **BR-SALES-007**: Card brand and terminal are interdependent (some terminals don't support all brands)
- **BR-SALES-008**: Payment method selection depends on form: if PIX/TEC, account selection is mandatory
- **BR-SALES-009**: Sale status: pendente (created) → pago (payment received/cleared)
- **BR-SALES-010**: Sales are immutable after creation (no edits, only cancellation/reversal)
- **BR-SALES-011**: Commission is calculated post-sale and tracked separately in a commission table

### Sales System — D+ Produtos

- **BR-SALES-012**: Proposta number must be unique per period (branch + year)
- **BR-SALES-013**: Valor do contrato must be numeric, positive, non-zero
- **BR-SALES-014**: Tabela and Banco are free-form text (user-entered without validation)
- **BR-SALES-015**: D+ sale does not trigger immediate payment; it's a proposal/registration

### Sales System — Access Control

- **BR-SALES-016**: Coordenador cannot create sales for other units
- **BR-SALES-017**: Assistente and Vendedor can only view/create sales for their unit
- **BR-SALES-018**: Segurança role has same access as Assistente (HR inclusion)
- **BR-SALES-019**: Gerente can view all units but cannot edit sales (report-only)
- **BR-SALES-020**: Financeiro can view all sales and create commission entries

---

## Data Model

### New Tables & Fields Required

#### 1. **Table: `employee_vacations`** (New)

```sql
CREATE TABLE employee_vacations (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  employee_id UUID NOT NULL (references favorecidos),
  
  -- Vacation entitlement
  admission_date DATE NOT NULL,
  last_vacation_period_end DATE,  -- ultimo período de férias vencidas
  vacation_expiry_date DATE NOT NULL,  -- data de vencimento das férias
  max_grant_deadline DATE,  -- prazo máximo para concessão
  
  -- Vacation usage
  vacation_start_date DATE,  -- período de gozo início
  vacation_end_date DATE,  -- período de gozo fim
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    -- pendente | programada | em_andamento | concluída
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON employee_vacations(branch_id);
CREATE INDEX ON employee_vacations(employee_id);
CREATE INDEX ON employee_vacations(status);
CREATE INDEX ON employee_vacations(vacation_expiry_date);
```

#### 2. **Table: `occupational_exams`** (New)

```sql
CREATE TABLE occupational_exams (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  employee_id UUID NOT NULL (references favorecidos),
  
  exam_type VARCHAR(20) NOT NULL,  -- admissional | periódico | demissional
  exam_date DATE NOT NULL,
  exam_expiry_date DATE,  -- required for periódico, null for others
  
  -- Document
  document_url TEXT,  -- file path/URL in storage
  document_name VARCHAR(255),
  document_type VARCHAR(20),  -- PDF, image, etc.
  
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON occupational_exams(branch_id);
CREATE INDEX ON occupational_exams(employee_id);
CREATE INDEX ON occupational_exams(exam_type);
CREATE INDEX ON occupational_exams(exam_expiry_date);
CREATE UNIQUE INDEX ON occupational_exams(employee_id, exam_type, exam_date);
  -- Prevents duplicate exams of same type on same date
```

#### 3. **Table: `vt_recharges`** (New) — Vale Transporte tracking

```sql
CREATE TABLE vt_recharges (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  employee_id UUID NOT NULL (references favorecidos),
  
  recharge_amount NUMERIC(10,2) NOT NULL,  -- valor da recarga
  recharge_date DATE NOT NULL,
  
  -- Optional integration with payroll
  payroll_id UUID (references payroll),  -- link to payroll if deducted
  
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON vt_recharges(branch_id);
CREATE INDEX ON vt_recharges(employee_id);
CREATE INDEX ON vt_recharges(recharge_date);
```

#### 4. **Table: `corporate_holidays`** (New) — Calendário Corporativo

```sql
CREATE TABLE corporate_holidays (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  
  holiday_date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  holiday_type VARCHAR(20) NOT NULL,  -- nacional | estadual | municipal
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON corporate_holidays(branch_id);
CREATE INDEX ON corporate_holidays(holiday_date);
CREATE UNIQUE INDEX ON corporate_holidays(branch_id, holiday_date);
```

#### 5. **Table: `medical_certificates`** (New) — Atestados

```sql
CREATE TABLE medical_certificates (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  employee_id UUID NOT NULL (references favorecidos),
  
  certificate_date DATE NOT NULL,  -- data do atestado
  absence_days INT NOT NULL,  -- quantidade de dias
  certificate_type VARCHAR(20) NOT NULL,  -- atestado | declaração
  
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON medical_certificates(branch_id);
CREATE INDEX ON medical_certificates(employee_id);
CREATE INDEX ON medical_certificates(certificate_date);
```

#### 6. **Table: `hr_alerts`** (New) — Sistema de Alertas (Global)

```sql
CREATE TABLE hr_alerts (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  
  alert_type VARCHAR(50) NOT NULL,
    -- vacation_expiring | vacation_expired | vacation_unscheduled
    -- exam_expiring | exam_expired
    -- birthday_upcoming | birthday_today
    -- (other future alert types)
  
  employee_id UUID NOT NULL (references favorecidos),
  related_entity_type VARCHAR(50),  -- vacation | exam | certificate
  related_entity_id UUID,
  
  alert_title VARCHAR(255) NOT NULL,
  alert_message TEXT,
  alert_date DATE NOT NULL,  -- date alert triggered
  
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON hr_alerts(branch_id);
CREATE INDEX ON hr_alerts(employee_id);
CREATE INDEX ON hr_alerts(alert_type);
CREATE INDEX ON hr_alerts(alert_date);
CREATE INDEX ON hr_alerts(dismissed);
```

#### 7. **Table: `sales_credit_card`** (New) — Venda Cartão de Crédito

This extends/replaces contract usage for credit card sales.

```sql
CREATE TABLE sales_credit_card (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  
  -- Client
  client_id UUID NOT NULL (references favorecidos),  -- type=cliente or ambos
  
  -- Sale amounts
  sale_value NUMERIC(10,2) NOT NULL,  -- valor da venda
  terminal_amount NUMERIC(10,2) NOT NULL,  -- valor da maquineta
  fee_rate NUMERIC(5,4) NOT NULL,  -- taxa aplicada (0.20 = 20%)
    -- or computed: (terminal_amount - sale_value) / sale_value
  
  -- Terminal and card details
  terminal VARCHAR(50) NOT NULL,
    -- sumup_w | sumup_r | sumup_h | laranjinha_h | c6_r
    -- pague_veloz | mercado_pago_r | pagbank_h
  card_brand VARCHAR(20) NOT NULL,
    -- master | visa | elo | amex | hiper
  card_last_four CHAR(4) NOT NULL,
  card_holder_name VARCHAR(255),
  
  -- Seller
  seller_id UUID NOT NULL (references favorecidos),  -- type=funcionario or ambos
  sale_type VARCHAR(20) NOT NULL,  -- venda_nova | casa
  
  -- Payment
  payment_method VARCHAR(50) NOT NULL,
    -- especie | pix | tec | (pix|especie)
  payment_account_id UUID,  -- if PIX/TEC, source account
    -- tf_central | tf_renta | tf_ralf (or references bank_accounts)
  
  -- Documents
  receipt_url TEXT,  -- generated receipt
  document_urls JSONB,  -- array of uploaded document URLs
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    -- pendente | pago
  payment_date DATE,
  
  -- Commission
  commission_calculated BOOLEAN DEFAULT FALSE,
  commission_amount NUMERIC(10,2),
  
  notes TEXT,
  created_by UUID,  -- user who created
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON sales_credit_card(branch_id);
CREATE INDEX ON sales_credit_card(client_id);
CREATE INDEX ON sales_credit_card(seller_id);
CREATE INDEX ON sales_credit_card(terminal);
CREATE INDEX ON sales_credit_card(status);
CREATE INDEX ON sales_credit_card(created_at);
```

#### 8. **Table: `sales_d_plus_products`** (New) — Venda D+ Produtos

```sql
CREATE TABLE sales_d_plus_products (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL (references branches),
  
  -- Client
  client_id UUID NOT NULL (references favorecidos),
  
  -- Proposal details
  proposal_number VARCHAR(50) NOT NULL UNIQUE,
  contract_value NUMERIC(10,2) NOT NULL,  -- valor do contrato
  
  -- User-entered fields (no validation)
  table_info VARCHAR(255),  -- tabela (user-entered)
  bank_info VARCHAR(255),  -- banco (user-entered)
  
  -- Seller
  seller_id UUID NOT NULL (references favorecidos),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    -- pendente | ativo | cancelado
  
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON sales_d_plus_products(branch_id);
CREATE INDEX ON sales_d_plus_products(client_id);
CREATE INDEX ON sales_d_plus_products(seller_id);
CREATE INDEX ON sales_d_plus_products(status);
CREATE INDEX ON sales_d_plus_products(created_at);
```

#### 9. **Modify Table: `favorecidos`** — Add HR-related fields

```sql
-- Add if not already present:
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS birth_date DATE;
-- Already exists based on database.ts

-- Ensure admission_date exists for employee tracking
ALTER TABLE favorecidos ADD COLUMN IF NOT EXISTS admission_date DATE;
```

#### 10. **Modify Table: `payroll`** — Link VT and add deduction tracking

```sql
-- Add if not already present:
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS vt_amount NUMERIC(10,2);
  -- Vale Transporte deduction (optional, if not in other_discounts)
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS vt_recharge_id UUID
  REFERENCES vt_recharges;
  -- Link to specific VT recharge record for audit trail
```

---

## User Interface Requirements

### HR Module Pages & Components

#### Page: /relatorios/hr or /hr/dashboard

**HR Dashboard** — Summary cards and quick access

- **StatCards** (reuse existing StatCard component):
  - "Férias próximas do vencimento" — count badge, click to filter vacation list
  - "Férias em andamento" — count badge, click to filter
  - "Exames vencendo" — count badge, click to filter
  - "Aniversariantes do mês" — count badge, click to filter
  - "Atestados do mês" — count badge + total days
  - Branch selector (if applicable)

#### Page: /hr/ferias

**Vacation Management**

- **Filters**: Name (search), Unit (dropdown), Month (select), Status (multi-select)
- **Table/List View**:
  - Columns: Employee name, Admission date, Vacation expiry date, Status, Vacation dates, Actions
  - Status badge with color (pendente=yellow, programada=blue, em_andamento=green, concluída=gray)
  - Actions: Edit, View, Delete
  - Sortable by name, expiry date, status
  
- **Modal: Add/Edit Vacation**:
  - Employee (dropdown, searchable by name/CPF)
  - Admission date (date picker)
  - Last vacation period end (date picker)
  - Vacation expiry date (date picker)
  - Max grant deadline (date picker)
  - Vacation start date (date picker)
  - Vacation end date (date picker)
  - Status (radio or dropdown: pendente, programada, em_andamento, concluída)
  - Notes (textarea)
  - Save/Cancel buttons

- **Calendar View** (optional, nice-to-have):
  - Month/year selector
  - Employee rows on Y-axis, days on X-axis
  - Color-coded vacation blocks
  - Drag-to-reschedule (edit on drop)

#### Page: /hr/exames

**Occupational Exams Management**

- **Filters**: Employee name (search), Unit, Exam type (select), Status (Expiring/Expired/Valid)
- **Table View**:
  - Columns: Employee name, Exam type, Exam date, Expiry date, Document, Status, Actions
  - Status badge (pending, valid, expiring_soon, expired)
  - Actions: View, Edit, Download document, Delete

- **Modal: Add Exam**:
  - Employee (dropdown, searchable)
  - Exam type (radio: admissional, periódico, demissional)
  - Exam date (date picker)
  - Expiry date (date picker, hidden if type != periódico; conditionally shown)
  - Document upload (file input, accept PDF/images)
  - Notes (textarea)
  - Save/Cancel

- **Document Viewer**:
  - Modal or new tab to view uploaded exam document

#### Page: /hr/vale-transporte

**Vale Transporte Management**

- **Filters**: Employee name, Unit, Month
- **Table View**:
  - Columns: Employee name, Daily rate, Working days, Total VT, Discount in payroll, Last recharge date, Actions
  - Actions: Add recharge, View history, Edit rate

- **Modal: Add VT Recharge**:
  - Employee (dropdown)
  - Recharge amount (currency input)
  - Recharge date (date picker)
  - Notes
  - Save/Cancel

- **Monthly Report**:
  - Button to generate/download monthly VT report
  - Export formats: Excel, PDF

#### Page: /hr/calendario

**Corporate Calendar**

- **Calendar View**:
  - Month selector (previous/next buttons)
  - Days of month in grid
  - Holidays highlighted (background color, e.g., red)
  - Vacation blocks overlaid (employee names if space)
  - Birthday indicators (star icon or special color)

- **Holiday Management**:
  - "Add Holiday" button opens modal
  - Modal: Date (date picker), Description (text), Type (select: nacional, estadual, municipal), Save/Cancel
  - Hover on holiday: show details
  - Right-click context menu: Edit, Delete

#### Page: /hr/aniversarios

**Birthdays Management**

- **Filters**: Month, Type (Funcionário | Cliente | Ambos), Unit
- **List View**:
  - Columns: Name, Type (employee/client), Birth date, Age, Days until birthday, Actions
  - Sort by days until birthday (upcoming first)
  - Highlight today's birthdays (yellow background)

- **Notifications**:
  - In-app toast: "Happy birthday, [name]!" on page load if birthday is today
  - Optional: Email notification (future)

#### Page: /hr/atestados

**Medical Certificates Register**

- **Filters**: Employee name, Month, Type (Atestado | Declaração), Unit
- **Table View**:
  - Columns: Employee name, Date, Days, Type, Notes, Actions
  - Actions: View, Edit, Delete
  - Total days per employee shown in footer or summary card

- **Modal: Add Certificate**:
  - Employee (dropdown)
  - Date (date picker)
  - Absence days (number input)
  - Type (radio: atestado, declaração)
  - Notes (textarea)
  - Save/Cancel

#### Component: Global Alert Panel

- **Location**: Top-right navbar or sidebar drawer
- **Trigger**: Bell icon with badge showing count of active alerts
- **Panel Content**:
  - List of alerts sorted by date (most recent first)
  - Each alert shows:
    - Type icon (vacation, exam, birthday, etc.)
    - Title ("Férias vencendo", "Exame vencido")
    - Employee name
    - Date
    - Dismiss button (X)
  - Link to relevant record (click to navigate)
  - If no alerts: "No active alerts"

### Sales System Pages & Components

#### Page: /vendas (refactored Contratos)

**Sales Dashboard/Registry**

- **Header**: Button to create new sale, split into "Venda Cartão de Crédito" and "Venda D+ Produtos"
- **Filters**: 
  - Date range
  - Client name
  - Seller/team
  - Terminal (for credit card sales)
  - Payment method
  - Status (pendente | pago)
  - Unit/branch

- **Table View**:
  - Columns: 
    - Date
    - Client name
    - Sale type (Cartão | D+ Produtos)
    - Value (sale value or contract value)
    - Seller
    - Payment method (or terminal for CC)
    - Status
    - Actions (View, Edit, Mark as paid, Delete)
  - Sortable by date, value, status
  - Color-coded status (pendente=yellow, pago=green)

#### Modal: Create Credit Card Sale

**Form structure** (in order of display as per requirement):

1. **Client Selection**
   - Text input with dropdown lookup
   - Searchable by name, CPF, phone
   - Display selected client's info (name, CPF, phone, category)

2. **Sale Amounts**
   - Valor da venda (currency input, e.g., 1000.00)
   - Valor da maquineta (currency input, e.g., 1200.00)
   - Taxa aplicada (auto-calculated percentage, editable)
     - Formula display: Sale value × (1 + fee%) = Terminal value

3. **Terminal Selection**
   - Dropdown: Sumup W, Sumup R, Sumup H, Laranjinha H, C6 R, Pague Veloz, Mercado Pago R, Pagbank H

4. **Card Details**
   - Bandeira (brand dropdown): MASTER, VISA, ELO, AMEX, HIPER
   - Final do cartão (text input, 4 digits, with validation)
   - Nome do titular (text input)

5. **Seller Selection**
   - Dropdown of funcionários
   - Radio option: "Venda nova" or "Casa" (own/house sale)

6. **Payment Method**
   - Radio buttons or dropdown:
     - ESPECIE (cash)
     - PIX
     - TEC
     - PIX | ESPÉCIE (combined)
   - If PIX or TEC selected:
     - Dropdown: TF CENTRAL, TF RENTA, TF RALF (or list of bank accounts)
   - Bank/PIX details displayed based on selection

7. **Documents**
   - File upload field (multiple files)
   - Accepted: images (JPG, PNG), PDF
   - Show uploaded file names/previews

8. **Receipt**
   - Button "Criar recibo" — generates and previews receipt before saving
   - Receipt template includes: date, client, sale amount, terminal, card last 4, seller, payment method

9. **Action Buttons**
   - Save (creates sale and generates receipt if not already done)
   - Save & Print Receipt
   - Cancel

#### Modal: Create D+ Produtos Sale

**Form structure**:

1. **Client Selection** (same as credit card)

2. **Proposal Details**
   - Número proposta (text, unique validation per period)
   - Valor do contrato (currency input)

3. **Product Details** (user-entered, no validation)
   - Tabela (text input, "digitável")
   - Banco (text or dropdown with common bank names)

4. **Seller Selection** (same as credit card)

5. **Action Buttons**
   - Save
   - Cancel

#### Page: /vendas/relatorio

**Sales Report**

- **Summary Section** (cards displaying):
  - Soma dos valores das maquinetas (total terminal amounts, credit card sales only)
  - Total de empréstimo (sum of contract values, D+ products)
  - Soma de vendas (total sale values)
  - Total de saídas (total outflows/discounts)
  - Total final (net)
  - Valor devolução sábado (Saturday returns/refunds)

- **Detail Sections**:
  - **Por Maquineta** (by terminal):
    - Table: Terminal | Count | Amount | %
    - Drilldown to individual sales
  
  - **Por Método de Pagamento** (by payment method):
    - Table: Method | Count | Amount | %
    - Cash | PIX | TEC breakdown
  
  - **Descontos** (discounts):
    - Table: Reason | Amount | Count
  
  - **Por Vendedor** (by seller):
    - Table: Seller name | Sales count | Total value | Commission (if calculated)

- **Filters & Export**:
  - Date range picker
  - Filter by seller, terminal, payment method
  - Export button (Excel, PDF)

---

## Integration Points

### Existing Modules Affected

1. **Favorecidos** (Client/Employee management)
   - Already has most fields needed (name, CPF, phone, birth_date, admission_date, banking info)
   - Need to ensure admission_date is captured on creation

2. **Folha de Pagamento** (Payroll)
   - Link to VT recharges table
   - Add VT amount field to payroll record
   - Calculate VT deduction based on recharges
   - Existing: already has transport_allowance field (may be same as VT or different)
   - **Clarification needed**: Is current transport_allowance same as Vale Transporte? Or separate?

3. **Contratos** (Sales/Contracts)
   - Refactor to support dual modes:
     - Old: Service contracts (keep existing data and logic)
     - New: Credit card & D+ product sales
   - Option A: Extend contracts table with new fields (sale_type, terminal, card_brand, etc.)
   - Option B: Create separate sales tables (credit card, d+ products) and archive old contracts
   - **Recommendation**: Option B (separate tables) to keep data model clean and avoid bloat

4. **Relatorios** (Reports)
   - Add HR section (may add page at /relatorios/rh or create new /hr/dashboard)
   - Add Sales section improvements (detail breakdown by terminal, method, seller)

5. **Usuarios/Access Control**
   - Refine roles: Segurança should have same access as Assistente
   - Add role-scoped visibility for alerts and sales

### New Hooks to Create

**HR Module**:
- `useEmployeeVacations(filters?)` — fetch, search, filter vacations
- `useCreateVacation()` — mutation
- `useUpdateVacation()` — mutation
- `useDeleteVacation()` — mutation
- `useOccupationalExams(filters?)` — fetch exams
- `useCreateExam()` — mutation with document upload
- `useVtRecharges(filters?)` — fetch VT data
- `useCreateVtRecharge()` — mutation
- `useVtMonthlyReport(month, year)` — fetch aggregated VT data
- `useCorporateHolidays(filters?)` — fetch holidays
- `useCreateHoliday()` — mutation
- `useMedicalCertificates(filters?)` — fetch atestados
- `useCreateCertificate()` — mutation
- `useHrAlerts(filters?)` — fetch alerts
- `useDismissAlert()` — mutation
- `useHrDashboardSummary()` — fetch KPIs for dashboard

**Sales Module**:
- `useSalesReports(filters?)` — fetch sales data
- `useCreateCreditCardSale()` — mutation with receipt generation
- `useCreateDPlusSale()` — mutation
- `useUpdateSaleStatus()` — mutation (mark as paid)
- `useSalesByTerminal(month?)` — fetch aggregated by terminal
- `useSalesByPaymentMethod(month?)` — fetch aggregated by method

### New Services to Create

**HR Module** (`src/services/hrModule.ts` or separate files):
- `getEmployeeVacations(filters)` — Supabase query
- `createVacation(data)` — insert with validation
- `updateVacation(id, data)` — update
- `deleteVacation(id)` — soft or hard delete
- `getOccupationalExams(filters)` — Supabase query
- `createExam(data)` — insert with document upload to storage
- `uploadExamDocument(file)` — file upload to Supabase Storage
- `getVtRecharges(filters)` — Supabase query
- `createVtRecharge(data)` — insert
- `generateVtMonthlyReport(branch_id, month, year)` — aggregated data
- `getCorporateHolidays(branch_id, year)` — fetch holidays
- `createHoliday(data)` — insert
- `getMedicalCertificates(filters)` — Supabase query
- `createCertificate(data)` — insert
- `getHrAlerts(branch_id, employee_id?)` — fetch active alerts
- `generateHrAlerts()` — compute alerts (run daily via cron or on-demand)
- `dismissAlert(id)` — mark dismissed

**Sales Module** (`src/services/sales.ts`):
- `getCreditCardSales(filters)` — Supabase query
- `createCreditCardSale(data)` — insert
- `getDPlusSales(filters)` — Supabase query
- `createDPlusSale(data)` — insert
- `generateSalesReceipt(saleId, type)` — template-based receipt HTML/PDF
- `getSalesReportData(branch_id, dateRange, filters)` — aggregated sales data
- `calculateCommissions(saleId)` — compute commission based on product rules
- `uploadSaleDocuments(files)` — batch upload to storage

### Database Queries & RLS Policies

All new tables should follow the multi-tenant pattern:

```sql
-- Example RLS policy for employee_vacations
CREATE POLICY "Users can view vacations from their branch"
  ON employee_vacations FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only HR or admin can create/update vacations"
  ON employee_vacations FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'financeiro')
    OR EXISTS (
      SELECT 1 FROM user_branch_access WHERE user_id = auth.uid() AND branch_id = branch_id
    )
  );
```

---

## Acceptance Criteria

### HR Module — Férias

- **AC-HR-001**: Given an employee with admission_date = 2022-01-15, when viewing their vacation record, then vacation_expiry_date is calculated as 2023-01-15 (12 months later)
- **AC-HR-002**: Given a vacation record with status = Pendente and vacation_expiry_date = 2026-05-11, when today is 2026-04-11, then a 30-day alert is generated
- **AC-HR-003**: Given a vacation record with status = Pendente and vacation_expiry_date = 2026-04-10 (yesterday), when fetching alerts, then an "Férias vencidas" alert is returned
- **AC-HR-004**: Given vacations filtered by Unit = "Administrativo" and Month = 5 (May), when rendering the list, then only vacations in May belonging to employees in Administrativo unit are shown
- **AC-HR-005**: Given a vacation in status = "Em andamento" with vacation_end_date = today, when user changes status to "Concluída", then update succeeds and record is marked as historical

### HR Module — Exames

- **AC-HR-006**: Given an exam_type = Periódico with exam_date = 2026-01-15 and exam_expiry_date = 2027-01-15, when today is 2026-12-16 (30 days before), then an alert is generated
- **AC-HR-007**: Given an exam_type = Admissional, when creating the record, then exam_expiry_date field is hidden/optional and treated as null
- **AC-HR-008**: Given an exam record, when uploading a document, then document is stored in Supabase Storage and URL is saved in database
- **AC-HR-009**: Given exam records for employee X, when exporting report, then all exams (admissional, periodic, demissional) are included with dates and document links

### HR Module — Vale Transporte

- **AC-HR-010**: Given a VT recharge with recharge_amount = 864.00 and recharge_date = 2026-04-11, when generating monthly report for April, then this recharge is included in the total
- **AC-HR-011**: Given payroll.transport_allowance and vt_recharges for the same month, when generating report, then both are shown and reconciled
- **AC-HR-012**: Given a VT monthly report for April with 5 employees, when exporting to Excel, then file includes employee names, daily rates, working days, totals, and sum row

### HR Module — Global Alerting

- **AC-HR-013**: Given multiple active alerts (vacation expiring, exam expired, birthday today), when opening alert panel, then all alerts are listed sorted by type priority and date
- **AC-HR-014**: Given an alert with dismissed=false, when user clicks dismiss, then alert.dismissed=true and alert is removed from display (does not re-appear until next calculation cycle)
- **AC-HR-015**: Given user role = Coordenador for Unit A, when viewing alerts, then only alerts for employees in Unit A are shown

### Sales System — Credit Card Sales

- **AC-SALES-001**: Given a credit card sale form, when user selects client "João Silva" and enters sale_value=1000, terminal_amount=1200, when fee_rate is auto-calculated, then fee = (1200-1000)/1000 = 0.20 (20%)
- **AC-SALES-002**: Given sale_value=100 and terminal_amount=90 (invalid), when user tries to save, then form validation fails with message "Terminal amount must be >= sale value"
- **AC-SALES-003**: Given a credit card sale with card_brand=VISA, terminal=Sumup W, when sale is created, then both fields are stored and displayed in report
- **AC-SALES-004**: Given a sale with payment_method=PIX and selected account=TF_RENTA, when sale is created, then payment_account_id references the correct account and details are included
- **AC-SALES-005**: Given a completed sale, when user clicks "Gerar recibo", then a receipt is generated with sale details, seller name, terminal, and payment method, displayed in modal for review
- **AC-SALES-006**: Given a sale with status=pendente, when user marks as "pago" and enters payment_date=2026-04-11, then status updates to "pago" and payment_date is recorded
- **AC-SALES-007**: Given sales for April 2026 with terminals [Sumup W, Mercado Pago R, Pagbank H], when generating report by terminal, then each terminal's sales are grouped with count and sum

### Sales System — D+ Produtos

- **AC-SALES-008**: Given a D+ sale with proposal_number="PROP-2026-001", when another sale is created with same proposal_number, then database rejects with unique constraint error
- **AC-SALES-009**: Given a D+ sale with contract_value=5000, tabela="8 PARCELAS", banco="BANCO DO BRASIL", when sale is saved, then all fields are stored as user-entered without validation

### Sales System — Access Control

- **AC-SALES-010**: Given user role=Assistente for Unit A, when viewing sales list, then only sales from Unit A are visible
- **AC-SALES-011**: Given user role=Gerente, when viewing sales across all units, then sales from all units are visible but no edit buttons appear (report-only)
- **AC-SALES-012**: Given user role=Vendedor for Unit B, when trying to create sale, then form restricts branch_id to Unit B and prevents change

### Sales System — Reporting

- **AC-SALES-013**: Given 10 credit card sales in April with terminals [3x Sumup W, 4x Mercado Pago R, 3x Pagbank H] and values [1000, 1200, 1500, ...], when generating summary, then "Soma dos valores das maquinetas" = sum of all terminal_amounts
- **AC-SALES-014**: Given sales with discounts (e.g., 2x 50 discount codes), when exporting report, then "Descontos" row shows total 100 and count 2
- **AC-SALES-015**: Given sales for period 2026-04-01 to 2026-04-30, when exporting to Excel, then file includes all data columns and summary rows, properly formatted

---

## Out of Scope

1. **Email notifications** — Alerting system currently uses in-app display. Email integration (SMTP, SendGrid) is not included.

2. **SMS/WhatsApp notifications** — Birthday and alert notifications via SMS/WhatsApp are not included.

3. **API integrations with external HR systems** — No integration with HRIS, payroll processors, or occupational exam providers. Data entry is manual.

4. **Commission payment automation** — Commission calculation is computed, but payment (financial entry creation, bank transfer) is manual or requires separate workflow.

5. **Audit trail on data changes** — No full audit log table. created_at/updated_at are recorded but not detailed change history.

6. **Real-time WebSocket notifications** — Alerting uses polling or page-refresh. No persistent WebSocket connections.

7. **Advanced analytics/ML** — No predictive models for vacation scheduling or sales forecasting.

8. **Mobile app** — All features are web-only.

9. **Integration with Supabase Real-time** — Could be added later for live alerts but not in scope.

10. **Vacation carryover rules** — Assumes simple 12-month expiry. Carryover policies (if country-specific) not implemented.

11. **Exam scheduling notifications** — System tracks exams but does not schedule or send exam appointment reminders.

12. **Sales receipt PDF generation** — Currently template-based HTML. Advanced PDF libs (e.g., pdfkit) not required; browser print-to-PDF sufficient.

13. **Offline mode** — All features require network connectivity.

14. **Historical salary rates for VT calculation** — VT daily rate is current/fixed. No historical tracking of rate changes.

---

## Assumptions Made

1. **Vacation admission date**: Assumed to be manually entered by HR on employee creation. Field `admission_date` added to favorecidos table if not present.

2. **Vacation 12-month rule**: Assumed Brazilian standard (30 days per year, expiry 12 months after admission or last vacation period). Carryover not implemented.

3. **Transport allowance (Vale Transporte)**: From the image, daily rate is fixed (e.g., R$ 9.00) and working days are counted (e.g., 24 days in April). Assumed this is per-employee or per-category configuration, stored elsewhere or hardcoded.

4. **Exam expiry dates**: For Periódico exams, assumed 12-month validity (standard in Brazil). Can be overridden per exam if needed.

5. **Alert calculation**: Alerts are computed on-demand when page loads or periodically (e.g., nightly). No real-time push notifications.

6. **Payment methods in sales**: "ESPECIE" = cash, "PIX" = bank transfer, "TEC" = account-to-account transfer. Assumed to be distinct payment rails.

7. **Terminal / Payment method independence**: Some terminals may not support all payment methods. Validation assumed to be UI-level (dropdowns filtered based on selection) rather than database constraint.

8. **Sales receipt template**: Basic HTML template with sale details. Assumed to be generated as HTML and printed via browser, not complex PDF generation.

9. **Commission calculation**: Commission rules assumed to exist in products table (commission_type, commission_pct, commission_min/max). Implementation is separate from this spec.

10. **Branch-scoped access**: All data is filtered by branch_id. Multi-branch manager (Gerente) can view all branches but typically from a single selected branch context.

11. **Favorecido types**: Client sales link to favorecido with type=cliente or type=ambos. Sellers link to favorecido with type=funcionario or type=ambos. Same person may have multiple records if playing multiple roles.

12. **Proposal numbering for D+ sales**: Assumed to be user-entered, not auto-generated. Unique constraint per branch/year.

13. **VT recharges immutability**: Assumed recharges cannot be edited or deleted, only new recharges added. Matches typical expense tracking pattern.

14. **Corporate holidays at branch level**: Holidays are branch-specific. National holidays are entered separately per branch (even though they're the same date).

15. **Alert dismissal**: Dismissed alerts do not persist as "read" permanently. On next alert cycle (e.g., next day), if condition still exists, alert regenerates. User can dismiss again.

16. **Atestados as immutable records**: Medical certificates are created once and never edited. If correction is needed, a new record is created and old one marked as superceded (or left as-is if policy allows).

---

## Open Questions / Blockers

### HR Module

1. **VT Daily Rate Configuration**: Where is the daily rate (e.g., R$ 9.00) configured? Per-employee, per-category, per-branch, or hardcoded? How does it vary?
   - *Impact*: Needed to calculate VT deduction in payroll and reports.

2. **VT vs. Transport Allowance in Payroll**: The current payroll schema has `transport_allowance` field. Is this the same as Vale Transporte, or a separate benefit? If same, should we migrate data or keep both?
   - *Impact*: Affects payroll integration and reporting.

3. **Occupational Exam Validity Period**: Is 12 months standard for Periódico exams, or does it vary? Any flexibility for different exam types (e.g., specific exams like audiometry vs. general)?
   - *Impact*: Alert triggering logic.

4. **Vacation carryover policy**: If vacation is not taken in the 12-month window, does it roll over to next year (with restrictions), or is it forfeited? Brazilian law varies by state.
   - *Impact*: Affects "Férias vencidas" logic and calculations.

5. **Alert resolution**: When an alert is dismissed, should it stay dismissed permanently, or re-appear next cycle? Should there be an "acknowledged" state separate from "dismissed"?
   - *Impact*: Alert state management and UI.

6. **Employee vs. Client in birthday tracking**: Can the same person (same CPF) be both employee and client in favorecidos table, or are they separate records?
   - *Impact*: Data modeling and deduplication in birthday lists.

7. **Document storage location**: Should exam documents be stored in Supabase Storage bucket, or external cloud storage (AWS S3, etc.)? What's the folder structure?
   - *Impact*: File upload/download implementation.

8. **HR module user access**: Who should see HR data? Can Gerente view HR data for other units? Should there be a separate "Gerente RH" role?
   - *Impact*: RLS policies.

### Sales System

9. **Terminal payment rules**: Are certain terminals restricted to certain payment methods? E.g., can Sumup W only accept card payments, not cash/PIX? Should this be validated?
   - *Impact*: Form validation and data entry flow.

10. **Fee calculation**: Is fee_rate always calculated from (terminal_amount - sale_value) / sale_value, or can it be manually entered and terminal_amount derived?
    - *Impact*: Form logic and validation.

11. **"Casa" sale type**: Does "venda nova" vs. "casa" affect commission calculation, reporting, or just tracking? Are there different business rules per type?
    - *Impact*: Commission logic and report filtering.

12. **Receipt generation**: Should receipts be generated immediately on save, or only when user clicks "Gerar recibo"? Should receipt be stored in database or regenerated on-demand?
    - *Impact*: UX flow and storage.

13. **Sales immutability**: Can a sale be edited after creation, or only deleted/cancelled? If editable, should there be an audit trail?
    - *Impact*: Form behavior and data integrity.

14. **D+ Products status workflow**: What are the valid state transitions for D+ sales? Pendente → Ativo → Cancelado? Are there other states (e.g., "Aguardando aprovação")?
    - *Impact*: Status validation and filtering logic.

15. **Saturday returns ("Valor devolução sábado")**: Is this a specific report field, or does it mean returns processed on Saturdays? Should it be a separate discount reason?
    - *Impact*: Report structure and data entry.

16. **Commission calculation timing**: When is commission calculated? Immediately on sale creation (mark as commission_calculated=true), or in a batch job at period-end?
    - *Impact*: Workflow and reporting.

17. **Multi-payment method**: When payment_method = "PIX | ESPÉCIE", does it mean both methods are used in a single transaction (e.g., partial PIX, partial cash)? Or is it a checkbox multi-select?
    - *Impact*: Data model (single field vs. array) and reporting.

### System-wide

18. **Role "Segurança"**: The spec mentions Segurança role with same access as Assistente. Is this a typo, or intentional? Typically security/guards don't register sales. Clarification needed.
    - *Impact*: RLS policy scope.

19. **Multi-branch context**: When a Gerente or admin switches branches, should data be re-filtered, or is there a separate view for multi-branch overview? Currently, app uses useBranchStore.
    - *Impact*: Hook design and performance.

20. **Alert calculation frequency**: Should HR alerts be calculated:
    - On-demand (each page load)?
    - Nightly (cron job, stored in hr_alerts table)?
    - Real-time (Supabase Real-time or WebSocket)?
    - *Impact*: Service architecture and performance.

---

## Technical Notes for Developer

### HR Module Implementation

1. **Use existing patterns**:
   - Follow `src/pages/FolhaPagamento/useFolhaPagamentoPage.ts` pattern for state management
   - Use `useBranchStore` to scope all queries by branch
   - Implement hooks with `useQuery` (fetch) and `useMutation` (create/update/delete)
   - Reuse shared components: `StatCard`, `PageHeader`, `LoadingState`, `EmptyState`, `AdvancedFilters`, `CurrencyInput`

2. **Vacation page structure**:
   - Create `src/pages/Hr/Ferias/` directory
   - Files: `FeoriasContainer.tsx`, `FeriasView.tsx`, `useFeoriasPage.ts`, `components/` (VacationForm, VacationList, etc.)
   - Use `react-datepicker` or `shadcn/ui` date picker for date fields
   - Implement dual-mode: table view + optional calendar view (calendar is nice-to-have)

3. **Exams page structure**:
   - Create `src/pages/Hr/Exames/`
   - For document upload: use Supabase Storage bucket, e.g., `exames/[branch_id]/[employee_id]/[filename]`
   - Implement document preview modal (use react-pdf for PDFs, img tag for images)
   - Handle file size limits (suggest 10MB max)

4. **Alert system**:
   - Create `src/components/shared/HrAlertPanel.tsx` (reusable component)
   - Mount in navbar/sidebar (similar to notifications bell)
   - Compute alerts via service: `generateHrAlerts()` called on page load, cached with React Query key
   - Consider stale-time: 5-10 minutes (don't recalculate on every page change)
   - Store in `hr_alerts` table for persistence (optional) or compute on-demand (simpler initially)

5. **VT integration with Payroll**:
   - When creating payroll record, fetch VT recharges for that employee/month
   - Auto-populate `vt_amount` in payroll form
   - In payroll calculation, include VT in deductions (or keep separate, depending on policy)
   - Link: `payroll.vt_recharge_id` (optional, for audit trail)

### Sales System Implementation

1. **Refactor Contratos module**:
   - Existing `/vendas` route points to `Contratos` component
   - Option A: Extend Contratos to handle both old contracts and new sales (add type enum)
   - Option B: Create new Sales module, archive old Contratos (recommended if old contracts are not actively used)
   - Recommendation: Option B — create `src/pages/Vendas/` as new module, keep old Contratos for reference only

2. **Sales form UX**:
   - Use `CurrencyInput` component from shared for monetary fields
   - For dropdown with search (client, seller), implement with `shadcn/ui` Select + search filter
   - Dynamically show/hide fields based on sale_type (Credit Card vs. D+ Products)
   - Conditional payment method fields (show account selection only for PIX/TEC)

3. **Receipt generation**:
   - Create `src/services/sales.ts` with `generateSalesReceipt(saleId, saleType)` function
   - HTML template in `src/templates/receiptTemplate.ts` or inline JSX
   - Use browser's `window.print()` for PDF generation (built-in)
   - Store receipt as HTML in database or regenerate on-demand from sale data

4. **Commission calculation**:
   - Commission logic depends on products table (product_id references products)
   - Service: `calculateCommissions(saleId)` — fetch product, apply rules, create entry in commissions table
   - Keep commission service separate from sales service (single responsibility)
   - Trigger: on sale creation OR in batch job (configurable)

5. **Reporting queries**:
   - Use aggregation functions in Supabase (`.select('terminal, count(*) as count, sum(sale_value) as total')` etc.)
   - Group by terminal, payment_method, seller_id, etc.
   - Implement filters as URL params or form state (useMemo to avoid re-renders)
   - Export: use library like `xlsx` (SheetJS) for Excel, or HTML-to-PDF (html2pdf)

6. **Access control (RLS)**:
   - Add RLS policies to sales_credit_card and sales_d_plus_products tables
   - Base policy: user can see sales from branches they have access to (via user_branch_access)
   - Role-specific: Gerente sees all branches; Coordenador sees own branch; Vendedor sees own sales (or own branch, TBD)
   - Enforce in backend (RLS) and frontend (conditional visibility based on useAuthStore role)

### Database Migrations

1. **Create new tables** (use Supabase migration files or SQL scripts):
   - `employee_vacations`, `occupational_exams`, `vt_recharges`, `corporate_holidays`, `medical_certificates`, `hr_alerts`
   - `sales_credit_card`, `sales_d_plus_products`

2. **Add indexes** for performance:
   - Index on `(branch_id, created_at)` for most queries
   - Index on `(employee_id)` for employee-centric views
   - Index on `(status)` for filtering by status
   - Index on `(expiry_date)` for alert queries

3. **Add RLS policies** for multi-tenant security:
   - All tables: `branch_id` visible only to users with access to that branch
   - HR tables: some read-only for Gerente, write-access for HR/admin
   - Sales tables: write-access varies by role/branch

4. **Backfill data** (if migrating from existing system):
   - Import vacations from external data source (e.g., Férias 2026 spreadsheet)
   - Import atestados from existing records
   - Backfill admission_date for existing employees (from favorecidos or external source)

### Type definitions (src/types/database.ts)

Update database types to include new tables:

```typescript
export type EmployeeVacation = Database['public']['Tables']['employee_vacations']['Row'];
export type OccupationalExam = Database['public']['Tables']['occupational_exams']['Row'];
export type VtRecharge = Database['public']['Tables']['vt_recharges']['Row'];
export type MedicalCertificate = Database['public']['Tables']['medical_certificates']['Row'];
export type HrAlert = Database['public']['Tables']['hr_alerts']['Row'];
export type SalesCreditCard = Database['public']['Tables']['sales_credit_card']['Row'];
export type SalesDPlusProduct = Database['public']['Tables']['sales_d_plus_products']['Row'];

// Insert and Update types also needed per table
```

### Hooks structure (src/hooks/)

Create or extend:

```typescript
// src/hooks/useHrModules.ts (or separate files per module)
export function useEmployeeVacations(filters?: VacationFilters) { ... }
export function useCreateVacation() { ... }
// ... etc.

// src/hooks/useSales.ts
export function useSalesReports(filters?: SalesFilters) { ... }
export function useCreateCreditCardSale() { ... }
// ... etc.
```

### Services structure (src/services/)

Create:

```typescript
// src/services/hrModule.ts
export async function getEmployeeVacations(filters: VacationFilters): Promise<EmployeeVacation[]> { ... }
export async function createVacation(data: EmployeeVacationInsert): Promise<EmployeeVacation> { ... }
export async function generateHrAlerts(branchId: string): Promise<HrAlert[]> { ... }

// src/services/sales.ts
export async function getCreditCardSales(filters: SalesFilters): Promise<SalesCreditCard[]> { ... }
export async function createCreditCardSale(data: SalesCreditCardInsert): Promise<SalesCreditCard> { ... }
export async function generateSalesReceipt(saleId: string): Promise<string> { ... }
```

### Performance considerations

1. **Alert calculation**: Computing 30-day alerts on every page load could be slow if many employees. Consider:
   - Caching with React Query: `staleTime: 5 * 60 * 1000` (5 minutes)
   - Or store pre-computed alerts in hr_alerts table (updated nightly)

2. **Sales reports**: Aggregation queries on large datasets. Use:
   - Database aggregation (GROUP BY, SUM) not client-side
   - Pagination if listing all sales (limit 50-100 per page)
   - Filter by date range (e.g., last 30 days) to reduce result set

3. **Vacation calendar**: If rendering all employees' vacations for a month, could be slow. Consider:
   - Pagination (e.g., show 20 employees per screen)
   - Or lazy-load by month (calendar view loads only selected month)

### Testing (no test framework currently in project)

While not in scope for implementation, suggest adding:
- Unit tests for alert calculation logic (`generateHrAlerts`, `isAlertTriggered`)
- Snapshot tests for receipt template
- Integration tests for payroll-VT linkage (if needed)

Use Jest + React Testing Library (standard for React projects)

---

## Revision History

| Version | Date       | Changes                                                                                      |
|---------|------------|----------------------------------------------------------------------------------------------|
| 1.0     | 2026-04-11 | Initial specification: HR module (Férias, Exames, VT, Calendário, Aniversários, Atestados) + Sales system refactor |

---

**Document prepared by**: Product Owner / Business Analyst  
**For**: LivreCred Development Team  
**Status**: Ready for Development (pending open questions clarification)
