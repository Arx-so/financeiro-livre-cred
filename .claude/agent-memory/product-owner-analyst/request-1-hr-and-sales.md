---
name: Request 1 Analysis — HR Module & Sales System Refactor
description: Complete analysis of client request for HR module (Férias, Exames, VT, etc.) and sales system transformation
type: project
---

## High-Level Overview

**Request scope**: Two major initiatives delivered via one specification document

1. **HR Module** — New comprehensive HR management system
   - Férias (Vacation) with status tracking and programming
   - Exames Ocupacionais (Occupational exams) with document upload
   - Vale Transporte (VT/Transportation allowance) with monthly reporting
   - Calendário Corporativo (Corporate calendar with holidays)
   - Aniversários (Birthday tracking with notifications)
   - Atestados (Medical certificates register)
   - HR Dashboard with KPIs
   - Global alerting system (30-day alerts for exams/vacation, day-of for birthdays)

2. **Sales System Refactor** — Transform existing Contratos module into POS system
   - Credit card sales with terminal selection, card brands, fee tracking
   - D+ Products (loans, consigned credit) registration
   - Payment method flexibility (cash, PIX, TEC transfers)
   - Commission tracking and calculation
   - Receipt generation
   - Sales reports with aggregations (by terminal, method, seller)

## Document Structure Delivered

1. **TECHNICAL_SPEC_REQUEST_1.md** (main spec, ~1500 lines)
   - Executive summary & business context
   - 27 functional requirements across HR & Sales
   - 34 business rules
   - Complete data model (10 new/modified tables)
   - UI requirements per page/component
   - Integration points
   - 15 acceptance criteria per module
   - Out of scope & assumptions (15+ each)
   - 25+ open questions for client clarification
   - Technical notes for developers

2. **TECHNICAL_SPEC_REQUEST_1_SUPPLEMENTS.md** (reference docs, ~800 lines)
   - Data examples from client documents (VT, Férias, Atestados with sample rows)
   - Screen flow mockups (textual ASCII diagrams)
   - API integration examples (RLS policies)
   - Configuration & constants (payment methods, statuses, etc.)
   - Import/export specifications (Excel sheet layouts)
   - Portuguese business glossary (24 terms)
   - Implementation priority roadmap (Phase 1-6, 7-8 weeks)
   - Common pitfalls & solutions (10 issues)

## Source Documents Analyzed

- CHECKLIST - rh.docx — Comprehensive HR module spec
- Detalhamento relatório vendas 2026.docx — Sales system details & payment flows
- RELATÓRIO DE VENDAS 2026.xlsx — Sales data example
- Folha 03_2026.xlsx — Payroll March 2026 reference
- WhatsApp images (3):
  - Férias 2026 planning spreadsheet
  - Vale Transporte April 2026 (R$ 9.00/day × 24 days = R$ 216.00/employee, R$ 97.26 discount shown)
  - Atestados 2026 (medical certificates with employee names, dates, days, types)

## Key Extracted Data Models

### Employee Vacations
- admission_date, last_vacation_period_end, vacation_expiry_date, max_grant_deadline
- vacation_start_date, vacation_end_date
- status: pendente | programada | em_andamento | concluída
- Alert: expiry 30 days before, unprogrammed alerts, expired alerts

### Occupational Exams
- exam_type: admissional | periódico | demissional
- exam_date, exam_expiry_date (required for periódico only)
- Document upload (PDF/images)
- Alert: 30 days before expiry for periódico, expired alerts

### Vale Transporte (VT)
- Daily rate (e.g., R$ 9.00) × working days = monthly deduction
- Example: 24 days × R$ 9.00 = R$ 216.00 total, R$ 97.26 discount on payroll
- Linked to payroll deductions, immutable recharges

### Medical Certificates
- certificate_date, absence_days, certificate_type (atestado | declaração)
- Immutable records (create-only, no edit)

### Credit Card Sales
- sale_value, terminal_amount, fee_rate = (terminal_amount - sale_value) / sale_value
- Terminal: 8 options (Sumup W/R/H, Laranjinha H, C6 R, Pague Veloz, Mercado Pago R, Pagbank H)
- Card brand: MASTER | VISA | ELO | AMEX | HIPER
- Seller attribution: venda_nova vs casa (own sale)
- Payment method: especie (cash) | pix | tec | pix|especie (combined)
- Status: pendente | pago

### D+ Produtos
- Client-entered fields: number proposal, contract value, table (terms), bank
- Simpler form than credit card, no terminal/card details

## Database Tables to Create

1. employee_vacations (vacation management)
2. occupational_exams (exam tracking with document URL)
3. vt_recharges (VT transaction log)
4. corporate_holidays (holiday calendar)
5. medical_certificates (atestados register)
6. hr_alerts (alert state management)
7. sales_credit_card (new sales type)
8. sales_d_plus_products (new sales type)
9. Modify favorecidos — ensure admission_date present
10. Modify payroll — add vt_amount and vt_recharge_id link

## Key Business Rules Extracted

**HR**:
- Vacation 12-month expiry from admission/last period (Brazilian law)
- Status progression: Pendente → Programada → Em andamento → Concluída
- Alerts: 30 days before expiry (vacations/exams), day-of (birthdays)
- VT = daily_rate × working_days, deducted from payroll
- Exams: no expiry for admissional/demissional, 12-month for periódico
- Atestados immutable (create-only)

**Sales**:
- Terminal amount ≥ Sale amount (includes fee)
- Fee auto-calculated or manually entered (TBD)
- Commission calculated post-sale based on product rules
- Sales immutable after creation (no edits, only cancellation)
- Some terminals/payment methods may have compatibility constraints
- Proposal number unique per branch/period (D+ products)

## Access Control (Refined Role Model)

- **Administrador**: Full access
- **Gerente**: All units, no Financeiro/RH edit (report-only)
- **Coordenador**: Own unit only
- **Assistente**: Own unit, reports/sales/cadastro
- **Vendedor**: Own unit, reports/sales/cadastro
- **Segurança**: Same as Assistente (HR inclusion — may need clarification)
- **Financeiro**: All financial data + commission payment
- **Recursos Humanos**: All HR data + creation/edit
- **Leitura**: Read-only (same as Assistente but no creation)

## Clarifications Needed from Client

### Critical (blocks development)
1. VT daily rate configuration — where stored, does it vary per employee/category?
2. Is current payroll.transport_allowance same as Vale Transporte? Data migration needed?
3. Vacation carryover policy — rolls over, forfeited, or restricted carryover?
4. Alert permanent dismissal or re-appear next cycle?
5. Same person as employee + client — same favorecido record or separate?

### Important (affects features)
6. Are certain terminals/payment methods incompatible? Validation needed?
7. Fee calculation — always formula, or sometimes manual entry?
8. Commission calculation — on sale creation or batch at period-end?
9. Multi-payment method (PIX|ESPÉCIE) — partial payments tracked separately?
10. "Segurança" role in sales — intentional or typo?

### Nice-to-have
11. Real-time WebSocket notifications or polling?
12. Email notifications for alerts?
13. Receipt PDF generation or browser print-to-PDF?
14. Audit trail for sales edits (if editable)?

## Implementation Roadmap

**Phase 1 (Weeks 1-2)**: Database schema + RLS policies + types
**Phase 2 (Weeks 2-3)**: HR core modules (Férias, Exames, VT, Calendário, Atestados)
**Phase 3 (Week 4)**: HR alerting + dashboard
**Phase 4 (Weeks 4-5)**: Sales form refactor + receipt generation
**Phase 5 (Week 6)**: Sales reporting + commission integration
**Phase 6 (Week 7)**: Testing, refinement, docs
**Total: 7-8 weeks**

## Key Patterns to Follow

- Use existing LivreCred patterns: Pages → Hooks (useQuery/useMutation) → Services → Supabase
- Branch scoping via useBranchStore
- Reuse shared components: StatCard, PageHeader, LoadingState, EmptyState, AdvancedFilters, CurrencyInput
- RLS for multi-tenant security
- TypeScript strict types (from database.ts)
- ESLint 4-space indent, 120 char max

## Likely Data Backfill Needs

- Vacation history from external Férias 2026 spreadsheet
- Atestados from existing records (e.g., the March 2026 image data)
- Employee admission dates (backfill from HR data if not in favorecidos)
- VT recharge history (from payroll records?)

**Why**: Decisions on data preservation & migration path TBD with client.

## Status

- Specification: Complete, developer-ready
- Awaiting: Client clarification on 13 open questions
- Next step: Client review, Q&A, then development begins Phase 1
