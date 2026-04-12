---
name: HR and Sales Module — Phase Completion
description: Status of HR/Sales module implementation (Phases A-D) and key architectural notes
type: project
---

## Status (as of 2026-04-12)

All phases complete and committed on the `adjusts` branch, including the Aniversários module.

**Phase A — Hooks (complete)**
- `src/hooks/useFerias.ts`, `useExames.ts`, `useValeTransporte.ts`, `useCalendario.ts`, `useAtestados.ts`, `useHrAlerts.ts`, `useSalesCreditCard.ts`, `useSalesDPlus.ts`
- All use TanStack React Query with branchId scoping; ADM branch sees all data

**Phase B — RH Pages (complete)**
- `src/pages/RH/index.tsx` — Dashboard with StatCards + alert list
- `src/pages/RH/Ferias.tsx`, `Exames.tsx`, `ValeTransporte.tsx`, `Calendario.tsx`, `Atestados.tsx`

**Phase C — Vendas Pages (complete)**
- `src/pages/Vendas/index.tsx` — Tabbed dashboard (Cartão de Crédito | Produtos D+), KPI cards, filters, CSV export, inline status update
- `src/pages/Vendas/CreditCardSaleModal.tsx` — Credit card sale form
- `src/pages/Vendas/DPlusSaleModal.tsx` — D+ product sale form (uses actual DB schema: proposal_number, contract_value, bank_info, table_info — no product_type/commission fields)
- `src/pages/Vendas/SaleReceipt.tsx` — Printable receipt dialog

**Phase D — Routing + Nav (complete)**
- Routes added to `src/App.tsx`: `/rh`, `/rh/ferias`, `/rh/exames`, `/rh/vale-transporte`, `/rh/calendario`, `/rh/atestados`, `/vendas/novo`
- `src/components/layout/AppSidebar.tsx` updated with RH sub-items and Cartão/D+ link

## Key Notes

- D+ DB schema (`sales_d_plus_products`) has NO `product_type`, `commission_rate`, or `commission_value` columns — spec was aspirational. Actual fields: `proposal_number`, `contract_value`, `bank_info`, `table_info`, `status` (pendente/ativo/cancelado)
- `SaleReceipt` is only for credit card sales (not D+)
- `/vendas` route still points to the old `Contratos` page — `/vendas/novo` is the new Sales module
- All RH pages use `EmptyState` with `icon` prop from lucide-react

**Phase E — Aniversários + VT CSV Export (complete)**
- `src/services/hrAniversarios.ts` — single shared Supabase query, three public filter fns; year-wrap sort fix
- `src/hooks/useAniversarios.ts` — `useBirthdaysToday` (1h stale), `useUpcomingBirthdays`, `useBirthdaysByMonth`
- `src/pages/RH/Aniversarios.tsx` — month navigator, 3 filter tabs, responsive card grid, "Hoje!" badge
- `src/services/hrValeTransporte.ts` — `exportVTMonthlyReportToCSV()` added
- `src/pages/RH/ValeTransporte.tsx` — CSV export button in PageHeader; `YEARS` moved to module scope
- `src/pages/RH/index.tsx` — "Aniversariantes Hoje" KPI card, upcoming birthdays strip, Aniversários quick-link
- Route `/rh/aniversarios` added; nav item in AppSidebar

**Why:** Continuation from a previous interrupted agent session. Backend services and DB migration were already done.
