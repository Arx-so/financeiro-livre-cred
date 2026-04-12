# Changelog

All notable changes to the LivreCred financial management system are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-04-12

### Added

#### Aniversários Module — RH Birthday Management (`/rh/aniversarios`)

- **Service** (`src/services/hrAniversarios.ts`):
  - `getBirthdaysToday(branchId)` — returns funcionários (type `funcionario` or `ambos`) whose birthday falls on today's month+day.
  - `getUpcomingBirthdays(branchId, days)` — returns employees with a birthday within the next N days; handles year-wrap (Dec → Jan) correctly by sorting on the actual next-occurrence timestamp rather than current-year ISO strings.
  - `getBirthdaysByMonth(branchId, month)` — returns all employees with a birthday in the given month, sorted by day-of-month.
  - All three functions share a single `fetchAllFuncionariosWithBirthday()` private query to avoid duplicate Supabase round-trips when multiple hooks are active simultaneously.

- **Hook** (`src/hooks/useAniversarios.ts`):
  - `useBirthdaysToday()` — staleTime and refetchInterval 1 hour (birthdays only change once a day).
  - `useUpcomingBirthdays(days = 30)` — staleTime 30 minutes.
  - `useBirthdaysByMonth(month)` — no staleTime override.
  - Cache keys namespaced under `['aniversarios']`, scoped by branchId.

- **Page** (`src/pages/RH/Aniversarios.tsx`):
  - Three filter tabs: Por Mês / Hoje / Próximos 30 dias.
  - Month navigator (prev/next buttons) visible only in "Por Mês" mode.
  - Responsive card grid (1 → 2 → 3 → 4 columns).
  - Each card shows name, type/category, birthday formatted in pt-BR, computed age for the current year, and a "Hoje!" badge with primary ring highlight for today's birthdays.

- **Route** `/rh/aniversarios` added to `src/App.tsx` and nav item added to `src/components/layout/AppSidebar.tsx` under Recursos Humanos.

#### VT Monthly Report CSV Export (Phase 2)

- **Service** (`src/services/hrValeTransporte.ts`):
  - `exportVTMonthlyReportToCSV(recharges, month, year)` — builds a UTF-8 BOM CSV with a title header comment, then rows of Funcionário / Documento / Total VT / Data Recarga. Returns the CSV string; the caller owns the download trigger.

- **Page** (`src/pages/RH/ValeTransporte.tsx`):
  - "Exportar CSV" button added to `PageHeader`; downloads `vt_{month}_{year}.csv` using the current period's individual recharge records.

### Changed

#### RH Dashboard (`/rh`) — Phase 3 KPI Fixes

- Added **Aniversariantes Hoje** StatCard (live count from `useBirthdaysToday()`) alongside the existing "Aniversários do Mês" aggregate card.
- Added **Próximos Aniversários** strip card: shows up to 5 upcoming birthdays in a compact row with a "Ver todos" link to `/rh/aniversarios`. Hidden when no upcoming birthdays.
- Added **Aniversários** quick-link in the Módulos RH panel pointing to `/rh/aniversarios`.
- Grid responsive breakpoints updated to `grid-cols-4 xl:grid-cols-7` to accommodate the extra KPI card.

## [1.1.2] - 2026-04-11

### Added

#### Sales Report Page (`/vendas/relatorio`)

- **Service** (`src/services/salesReport.ts`):
  - `buildTerminalBreakdown()` — groups CC sales by terminal, computing count, sale_value_sum, terminal_amount_sum, fee_sum, and fee_pct per terminal.
  - `buildBrandBreakdown()` — groups CC sales by card_brand, including pct_of_total calculated against the grand sale value.
  - `buildSellerBreakdown()` — merges CC and D+ sales by seller_id, producing cc_count, cc_value, dplus_count, dplus_commission, and total per seller. Null sellers are grouped under `[Sem Vendedor]` and sorted last.
  - `computeKPIs()` — derives total_bruto (sum terminal_amount), total_liquido (sum sale_value), total_taxa, total_transacoes (CC + D+ count), and total_dplus (sum commission_value).
  - `exportReportToCSV()` — builds a UTF-8 BOM CSV with header comments (KPI summary, branch, date range), then CC detail, D+ detail, and all three breakdown summaries. Triggers browser download.
  - `getSalesReport()` — orchestrates parallel calls to `getCreditCardSales` and `getDPlusSales`, applies client-side `sale_date` filtering (existing services filter by `created_at`), and returns all aggregated data.

- **Hook** (`src/hooks/useSalesReport.ts`):
  - `useSalesReport({ dateFrom, dateTo, terminals?, sellerIds? })` — wraps `getSalesReport` with React Query, scopes `branchId` from `useBranchStore`, staleTime 30s.

- **Page** (`src/pages/Vendas/RelatorioVendas.tsx`):
  - Filters row: date-from / date-to inputs (default: today), terminal single-select, seller single-select (options dynamically built from fetched data for the current period).
  - Four KPI StatCards: Total Bruto (primary), Total Líquido (income), Total Taxas (expense), Total Transações (default).
  - Five Shadcn Tabs with tab-count badges:
    - **Cartão de Crédito** — detail rows grouped by terminal, subtotal row per terminal group, grand-total row.
    - **Produtos D+** — detail rows grouped by seller, subtotal per seller, grand-total row.
    - **Por Terminal** — one row per terminal with Qtd / Valor Venda / Maquineta / Taxa% / Taxa R$.
    - **Por Bandeira** — one row per card brand with % do Total column.
    - **Por Vendedor** — one row per seller combining CC and D+ metrics.
  - `EmptyState` (icon=BarChart3/CreditCard/Banknote) shown when no data in a section.
  - `LoadingState` shown during fetch; error state shown on query failure.
  - "Exportar CSV" button in PageHeader, disabled when no data.

- **Routing** (`src/App.tsx`): route `/vendas/relatorio` → `RelatorioVendas` (ProtectedRoute).

- **Navigation** (`src/components/layout/AppSidebar.tsx`): "Relatório de Vendas" item with `BarChart3` icon added under the Vendas accordion group; accessible to admin, gerente, usuario, vendas, and financeiro roles.

## [1.1.1] - 2026-04-11

### Added

#### Sales Module — Gerar Lançamentos Financeiros

- **Migration** (`supabase/migrations/037_sales_financial_entries.sql`):
  - Added `credit_card_sale_id` (FK → `sales_credit_card`) and `dplus_sale_id` (FK → `sales_d_plus_products`) columns to `financial_entries` with indexed lookups.
  - Added `financial_entries_generated BOOLEAN DEFAULT FALSE` to both `sales_credit_card` and `sales_d_plus_products` to prevent duplicate generation.

- **Services**:
  - `salesCreditCard.ts` — `previewCreditCardSaleEntries()` returns a typed preview of the receita (net value after terminal fee) and despesa (terminal fee amount) that will be created. `generateFinancialEntriesFromCreditCardSale()` creates both financial entries via the shared `createFinancialEntries()` helper and marks the sale as generated.
  - `salesDPlus.ts` — `previewDPlusSaleEntries()` returns a preview of the single receita (commission/contract value). `generateFinancialEntriesFromDPlusSale()` creates the entry and marks the sale as generated.

- **Hooks**:
  - `useSalesCreditCard.ts` — `useGenerateCreditCardSaleEntries()` mutation with `toast.success` / `toast.error` feedback and automatic invalidation of `financial-entries` and `sales-credit-card` cache keys.
  - `useSalesDPlus.ts` — `useGenerateDPlusSaleEntries()` mutation with same cache invalidation pattern.

- **UI** (`src/pages/Vendas/index.tsx`):
  - Added a "Lançamentos" column to both the Cartão de Crédito and Produtos D+ tables.
  - Each row shows a "Gerar" button (with `TrendingUp` icon) when entries have not yet been generated, or a `CheckCircle2` "Gerados" badge once created — matching the Contratos module pattern.
  - Clicking "Gerar" opens a confirmation modal (Dialog) previewing the entries (emerald card for receita, red card for despesa) before committing. Includes loading spinner during mutation and Cancelar / Confirmar buttons.

## [1.1.0] - 2026-04-11

### Added

#### HR Module (Recursos Humanos)

- **Database Foundation**: 6 new Supabase tables with full RLS policies scoped by `branch_id`
  - `employee_vacations` — tracks vacation requests with start/end dates and status (pending, aprovado, em_andamento, concluido, cancelado)
  - `occupational_exams` — manages occupational health exams (periodic, admissional, demissional) with expiry tracking and document storage
  - `vt_recharges` — Vale Transporte (public transit allowance) recharge tracking with daily_rate and working_days calculation (default R$9.00/day)
  - `corporate_holidays` — holiday calendar for payroll and scheduling purposes
  - `medical_certificates` — employee medical certificates with document aggregation by employee
  - `hr_alerts` — alert system for vacation/exam expiries (30-day advance warnings) and birthday notifications with priority ordering

- **Service Layer** (`src/services/hr*.ts`):
  - `hrFerias.ts` — CRUD operations for vacation management with expiry detection queries
  - `hrExames.ts` — CRUD + document upload to Supabase Storage with expiry queries
  - `hrValeTransporte.ts` — CRUD + monthly aggregation for VT reports
  - `hrCalendario.ts` — CRUD for corporate holiday calendar
  - `hrAtestados.ts` — CRUD + report aggregation by employee
  - `hrAlerts.ts` — on-demand alert generation (vacation/exam expiry, birthdays) with dashboard KPI metrics

- **React Query Hooks** (`src/hooks/use*.ts`):
  - `useFerias` — query/mutation for vacation data with branch scoping
  - `useExames` — query/mutation for occupational exam data with cache invalidation
  - `useValeTransporte` — query/mutation for VT recharge tracking
  - `useCalendario` — query/mutation for corporate holidays
  - `useAtestados` — query/mutation for medical certificates
  - `useHrAlerts` — query for alert generation with 30-day warning filters and birthday notifications

- **HR Pages** (`src/pages/RH/`):
  - **HR Dashboard** (`/rh`) — KPI cards (vacation balance, upcoming exams, birthdays) + alert list with priority-based sorting
  - **Férias** (`/rh/ferias`) — vacation request form, approval workflow, status filters, and expiry visualization
  - **Exames Ocupacionais** (`/rh/exames`) — exam scheduling, document upload, expiry tracking, and periodic compliance reports
  - **Vale Transporte** (`/rh/vale-transporte`) — recharge management, monthly aggregation, and cost analysis
  - **Calendário Corporativo** (`/rh/calendario`) — holiday calendar with quick-add and bulk import
  - **Atestados** (`/rh/atestados`) — medical certificate upload, employee aggregation, and compliance tracking

- **HR Constants** (`src/constants/hr.ts`):
  - Vacation statuses: pending, aprovado, em_andamento, concluido, cancelado
  - Exam types: periodico, admissional, demissional
  - Certificate types: atestado, laudo, parecer
  - Holiday types: feriado, pont

#### Sales Module (Vendas)

- **Database Foundation**: 2 new Supabase tables with RLS policies scoped by `branch_id`
  - `sales_credit_card` — credit card sales with 8 payment terminal options, 5 card brands (Visa, Mastercard, Elo, Hipercard, American Express), fee_rate auto-calculation, and settlement tracking
  - `sales_d_plus_products` — D+ installment loan products (empréstimo pessoal, consignado privado/público, FGTS, outros) with bank transfer tracking and seller attribution

- **Service Layer** (`src/services/sales*.ts`):
  - `salesCreditCard.ts` — CRUD + fee_rate auto-calculation based on terminal/brand + sales report aggregation by seller and terminal
  - `salesDPlus.ts` — CRUD + sales report aggregation by seller and bank with product type filtering

- **React Query Hooks** (`src/hooks/use*.ts`):
  - `useSalesCreditCard` — query/mutation for credit card sales with branch filtering and cache invalidation
  - `useSalesDPlus` — query/mutation for D+ product sales with seller and bank filtering

- **Sales Pages** (`src/pages/Vendas/`):
  - **Sales Dashboard** (`/vendas/novo`) — tabbed interface with Cartão de Crédito and Produtos D+ views
    - **Cartão de Crédito Tab**: KPI cards (daily sales, fee revenue), transaction table with terminal/brand filters, CSV export
    - **Produtos D+ Tab**: KPI cards (product sales volume, settlement rate), transaction table with product/bank filters, CSV export
  - **CreditCardSaleModal** — form for recording credit card sales with terminal selection, card brand, payment method (credit/debit/pix), amount, fee rate, and settlement date
  - **DPlusSaleModal** — form for recording D+ product sales with product type selection, bank, seller, and installment terms
  - **SaleReceipt** — printable receipt dialog for sales confirmation with itemized fee breakdown

- **Sales Constants** (`src/constants/sales.ts`):
  - 8 payment terminals (device identifiers for POS systems)
  - 5 card brands (Visa, Mastercard, Elo, Hipercard, American Express)
  - Payment methods: credit, debit, pix
  - Transfer sources: instantaneo, proximo_dia, d_mais_2, d_mais_3

### Changed

- **Service Layer Refactoring**:
  - Unified file upload logic: replaced inline storage upload implementations in `hrExames.ts` and `salesCreditCard.ts` with the existing `uploadFile()` utility from `src/services/storage.ts`
  - Optimized HR alerts generation: parallelized `getExpiringVacations()` and `getExpiringExams()` calls with `Promise.all()` (was sequential)
  - Replaced magic strings with constants: vacation statuses, exam types, and certificate types now reference constants from `src/constants/hr.ts` instead of hardcoded literals
  - Fixed date range calculation: `getEmployeeVacations()` now uses proper last-day-of-month calculation instead of hardcoded day 31

- **Database Types** (`src/types/database.ts`):
  - Added 24 new TypeScript types (Row/Insert/Update variants for 8 new tables) with proper nullable field handling and branch_id scoping

- **Sidebar Navigation** (`src/components/layout/AppSidebar.tsx`):
  - Added RH (Recursos Humanos) menu section with 6 sub-items: Férias, Exames, Vale Transporte, Calendário, Atestados, Dashboard
  - Added Vendas menu section with 2 items: Cartão de Crédito, Produtos D+

- **Routing** (`src/App.tsx`):
  - Registered 7 new HR routes: `/rh`, `/rh/ferias`, `/rh/exames`, `/rh/vale-transporte`, `/rh/calendario`, `/rh/atestados`
  - Registered 1 new Sales route: `/vendas/novo`
  - All routes protected by `ProtectedRoute` HOC with branch context

### Fixed

- **ESLint Compliance**: Resolved all linting errors across new HR and Sales modules
  - Fixed `object-curly-newline` errors in hook parameter destructuring
  - Fixed `prefer-template` errors (replaced string concatenation with template literals)
  - Fixed `react/jsx-one-expression-per-line` in JSX multiline expressions
  - Fixed `implicit-arrow-linebreak` errors in arrow function returns
  - Fixed `react/jsx-curly-brace-presence` (removed unnecessary braces in JSX attributes)
  - Added missing `icon` props to `EmptyState` component usages throughout RH and Sales pages

- **UI/UX Consistency**: Ensured all HR and Sales pages follow existing Shadcn component patterns and icon requirements

### Database

- Created Supabase migrations:
  - `supabase/migrations/035_hr_module.sql` — HR tables with indexes on `branch_id`, `employee_id`, `created_at` for query performance and RLS policies for multi-tenant isolation
  - `supabase/migrations/036_sales_module.sql` — Sales tables with indexes on `branch_id`, `seller_id`, and created_at with RLS policies matching existing user_branch_access pattern

### Notes

- All new tables use RLS (Row Level Security) with the established `user_branch_access` pattern for multi-tenant isolation scoped by `branch_id`
- HR alerts are generated on-demand and cached; for real-time alerts, consider integrating with a background job service
- Sales fee rates are auto-calculated by `salesCreditCard.ts` but can be manually overridden; future versions may add fee rate matrix management
- VT calculation uses configurable daily_rate (default R$9.00) and working_days; consider adding a settings UI for per-branch customization

---

## [1.0.0] - 2026-01-15

### Added

- Initial release of LivreCred financial management system
- Core authentication with Supabase
- Multi-branch (Unidade) support with branch switching
- Budget planning module (Planejamento) with hierarchical budget management and versioning
- Income/Expense (Receita/Despesa) tracking
- Bank reconciliation (Conciliação) module
- Client/Supplier/Employee (Favorecido) management
- Sales targets (Metas) and commissions (Comissões) tracking
- Income statement (DRE) reporting
- Responsive UI built with React 18, TypeScript, and Shadcn components
- Dark/light theme support with Zustand state management
- Real-time search and advanced filtering

### Technical

- React 18 with TypeScript and Vite
- TanStack React Query for data fetching and caching
- Supabase for backend and real-time capabilities
- Shadcn UI component library
- Zustand for global state management (auth, branch selection)
- React Router v6 for navigation
- ESLint (Airbnb-based flat config) for code quality
