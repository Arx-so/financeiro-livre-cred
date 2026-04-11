---
name: LivreCred Project Context
description: Domain vocabulary, architecture, and technical patterns for changelog generation
type: project
---

## Domain Vocabulary

- **Unidade/Branch** — company branch/location (multi-tenant by branch)
- **Favorecido** — client, supplier, or employee entity
- **Receita/Despesa** — income/expense
- **Folha de Pagamento** — payroll
- **Conciliação** — bank reconciliation
- **Orçamento/Planejamento** — budget planning with version management
- **Metas** — sales targets
- **Comissões** — sales commissions
- **DRE** — income statement report
- **Recursos Humanos** — HR module (vacations, exams, VT, alerts)
- **Vendas** — Sales module (credit card sales, D+ products)

## Architecture & Data Flow

```
Pages (src/pages/) → Hooks (src/hooks/) → Services (src/services/) → Supabase
```

- **Services** make Supabase queries and return typed data
- **Hooks** wrap services with TanStack React Query (useQuery/useMutation) and manage cache keys
- **Pages** consume hooks, wrapped in AppLayout
- **Stores** (Zustand): useAuthStore, useBranchStore (persisted)
- **Types** defined in src/types/database.ts (Row/Insert/Update per table)

## Multi-Tenant Pattern

All new tables must include:
- `branch_id` foreign key
- RLS policies scoped by `user_branch_access` pattern
- Indexes on `branch_id`, `created_at` for performance

## Changelog Format Conventions

When writing changelog entries for LivreCred:
- Write in English
- Include module name in parentheses (HR Module, Sales Module, Planejamento, etc.)
- For new tables: list by `table_name` with brief purpose description
- For new pages: list route path and primary features
- Group service/hook/page changes by module
- Highlight RLS and multi-tenant compliance
- Note breaking changes to public APIs or database schema

## Key Files for Changelog Generation

- `src/constants/hr.ts` — HR module constants (vacation statuses, exam types, etc.)
- `src/constants/sales.ts` — Sales module constants (terminals, card brands, payment methods)
- `src/services/hr*.ts`, `src/services/sales*.ts` — service layer implementations
- `src/hooks/use*.ts` — React Query wrappers
- `src/pages/RH/`, `src/pages/Vendas/` — page components
- `src/types/database.ts` — TypeScript type definitions
- `supabase/migrations/*.sql` — database schema
- `src/components/layout/AppSidebar.tsx` — navigation structure
- `src/App.tsx` — route registration

## Common Patterns to Document

- **Service layer additions**: Note CRUD operations, aggregation queries, and storage interactions
- **Hook additions**: Document query/mutation signatures and cache key patterns
- **Page additions**: List route path, tabs/sections, KPI cards, and export capabilities
- **Database migrations**: Highlight RLS policies, indexes, and new table relationships
- **ESLint fixes**: Group by type (object-curly-newline, implicit-arrow-linebreak, etc.)

## Versioning Scheme

Uses Semantic Versioning. Current major version is 1.x.x. Date format for releases: YYYY-MM-DD.
