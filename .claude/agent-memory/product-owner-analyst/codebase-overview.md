---
name: LivreCred Codebase Architecture
description: Core architecture and existing modules in LivreCred financial management system
type: reference
---

## Existing System Structure

**Stack**: React 18 + TypeScript + Vite + Supabase

**Multi-tenancy**: By branch (Unidade/branches table)

**Data flow**: Pages → Hooks → Services → Supabase

**Key tables**:
- `profiles` — Users
- `branches` — Unidades/locations
- `user_branch_access` — User-branch mapping (multi-tenant security)
- `favorecidos` — Clients/suppliers/employees (FavorecidoTipo: cliente|fornecedor|funcionario|ambos)
- `financial_entries` — Income/expenses with recurring support
- `categories`, `subcategories` — Entry categorization
- `bank_accounts` — Bank details per branch
- `payroll` — Folha de Pagamento (exists, has overtime, benefits, discounts, net_salary calculation)
- `contracts` — Contratos (exists, but designed for service contracts not sales)
- `products` — Product catalog with commission rules
- `sales_targets` — Metas with commission rates

**Existing pages/modules**:
- FolhaPagamento (Payroll) — working, with batch generation support
- Contratos (Sales) — exists as contracts, being repurposed for sales
- Favorecidos (Client/Employee management)
- Relatorios/VendasMetas (Sales targets reports)
- Planejamento (Budget) — complex, 9 components
- Financeiro (General ledger)
- Conciliacao (Bank reconciliation)

**Authorization/Roles**: admin|gerente|usuario|financeiro|vendas|leitura

## Key Architectural Patterns

1. Services layer (`src/services/*.ts`) — Supabase queries, typed with database.ts interfaces
2. Custom hooks (`src/hooks/*.ts`) — TanStack React Query wrappers (useQuery/useMutation)
3. Branch scoping via `useBranchStore` — all queries filtered by branch_id
4. Shared components — StatCard, PageHeader, LoadingState, EmptyState, CurrencyInput, SearchInput, AdvancedFilters
5. Code style — 4-space indentation, max 120 chars, @/* path alias

## Payroll (Folha de Pagamento) - Already Exists

Has: base_salary, overtime_hours/value, transport_allowance, meal_allowance, other_benefits, INSS/IRRF/other_discounts, net_salary calculation, status (pendente|pago), payment_date, batch generation, recurring templates

Missing from client request: Integration with Vale Transporte management, historical tracking of admissions
