---
name: Recent major releases (v1.2.0 and v1.1.x)
description: Summary of HR and Sales module rollout April 2026, including patterns and conventions established
type: project
---

## April 2026 Release Cycle

### v1.2.0 (2026-04-12) — HR & Sales Modules Phase 2
**Why:** Major feature expansion from "request_1" deliverable, consolidating HR workforce management and sales tracking capabilities.

Delivered two complete modules:

**HR Module Completion:**
- Férias with Programação Anual yearly grid view
- Atestados (medical certificates) with consolidated reporting
- Vale Transporte with monthly CSV export
- Exames Ocupacionais with document upload and expiry tracking
- Calendário Corporativo (holiday calendar)
- Aniversários with birth_date sourcing from favorecidos and monthly filters
- RH Dashboard with KPI cards and upcoming birthday strips

**Sales Module Phase 2:**
- Cartão de Crédito sales creation with 8 terminals, 5 brands, installments
- Produtos D+ legacy product sales (empréstimo, consignado, FGTS)
- Relatório de Vendas with 5-tab reporting (CC, D+, Terminal, Brand, Seller breakdown)
- Financial entry auto-generation (receita + despesa) for both sale types
- VendedorSelect reusable component

**Key architectural patterns established:**
1. ADM branch pattern (`${branchId}-admin`/`${branchId}-adm`) applied uniformly across all new hooks
2. `confirmDelete` utility at `src/lib/confirmDelete.ts` replaces `window.confirm` throughout
3. All monetary inputs now use `CurrencyInput` (BRL mask, cent-based)
4. `value="all"` sentinel pattern for Radix UI SelectItem empty/default values
5. `financial_entries_generated` boolean flag prevents duplicate financial entry generation
6. FavorecidoSelect "+" button inline Dialog for quick entity creation with auto-select

### v1.1.4 (2026-04-11) — Bug fixes for Sales & HR
- Seller listing empty bug: fixed `.eq('type')` to `.in('type', [...])` for 'ambos' inclusion
- Missing "+" buttons: added FavorecidoSelect inline Dialog for quick favorecido creation
- ValeTransporte inputs: replaced Input type="number" with CurrencyInput
- Birthday listing empty: added `.limit(1000)` to prevent Supabase row truncation

### v1.1.3 (2026-04-12) — Aniversários module & VT CSV export
- Aniversários page with three tabs (Por Mês / Hoje / Próximos 30 dias)
- `getBirthdaysToday`, `getUpcomingBirthdays`, `getBirthdaysByMonth` service functions
- Year-wrap handling for Dec→Jan transitions using `birthdayThisYear` timestamp sorting
- VT monthly report CSV export with UTF-8 BOM
- RH Dashboard enhancements: today's birthdays count, upcoming strip, Aniversários quick-link

### v1.1.2 (2026-04-11) — Sales Reporting
- Relatório de Vendas with KPI aggregation, terminal/brand/seller breakdowns
- CSV export with header comments (KPI summary, branch, date range)
- Five tabbed reports with detail + summary rows
- Client-side `sale_date` filtering (services filter by `created_at`)

### v1.1.1 (2026-04-11) — Sales Financial Entries
- `credit_card_sale_id` and `dplus_sale_id` FKs added to financial_entries
- `financial_entries_generated` boolean on both sale tables
- Preview modals for receita/despesa pairs before generation
- Automatic cache invalidation for financial-entries and sales cache keys

## How to apply

When building new modules:
- Always use ADM branch pattern for multi-tenant isolation in new hooks
- Replace any `window.confirm` with `confirmDelete` utility from `src/lib/confirmDelete.ts`
- Use `CurrencyInput` for all BRL monetary fields (not Input type="number")
- Apply `value="all"` sentinel pattern in Radix SelectItem for empty/placeholder options
- If mutation creates related financial entries, include `_generated` boolean flag + preview modal
- Include inline Dialog "+" button on entity selectors for quick-add workflows
- Favor CSV export with UTF-8 BOM header comments over simple comma-delimited
