---
name: HR and Sales module review (Phase 2)
description: Detailed review findings for HR and Sales UI implementation commits f60b1eb and 9409c94
type: project
---

## Summary

HR and Sales modules (RH and Vendas) are well-architected. React Query cache keys correctly include `branchId`, mutations properly invalidate related keys, all TypeScript types are safe, filter logic is consistent, and both modules correctly integrate with the existing app patterns (AppLayout, PageHeader, shared components, Zustand stores).

## Key Strengths Observed

1. **Consistent React Query patterns**: All hooks follow `feriasKeys`, `examesKeys`, `vtKeys`, etc. structure with proper cache invalidation (`queryKey: feriasKeys.all` invalidates all related queries).
2. **Branch filtering**: Both modules correctly use `useBranchStore` with ADM branch logic (`isAdm ? undefined : branchId`).
3. **Type safety**: No `any` types, all data types align with `database.ts` definitions.
4. **Filter logic**: Consistent pattern `filterStatus === 'all' ? undefined : filterStatus` across all pages.
5. **Shared components**: Pages correctly use PageHeader, LoadingState, EmptyState, StatCard, FavorecidoSelect.
6. **AppLayout wrapper**: All pages wrapped correctly.
7. **Form validation**: Both modals have clear validation before mutation.
8. **Error handling**: Toast notifications on success/error via `sonner`.

## Architecture Layers

- **Services**: hrFerias, hrExames, hrValeTransporte, hrCalendario, hrAtestados, hrAlerts, salesCreditCard, salesDPlus (not reviewed but expected)
- **Hooks**: Wrap services with TanStack React Query, export cache keys and types
- **Pages**: Consume hooks, manage local form state, wrap in AppLayout
- **App.tsx**: Routes properly protected with ProtectedRoute wrapper
- **AppSidebar**: Navigation correctly added to both Vendas and Recursos Humanos sections

## Business Logic Verified

- **Vacation alerts**: 30-day threshold used correctly in Ferias and useExpiringFerias
- **VT calculation**: daily_rate × working_days formula (default R$9.00/day, form shows helper calculation)
- **Exam expiry logic**: Consistent date formatting and expiry checking
- **D+ contract model**: Supports contract_value tracking (commission_value calc expected in service layer)
- **Status badges**: Correct color coding (yellow=pending, green=active/paid, red=cancelled)

## File Inventory

✓ All 8 hooks present and correctly structured
✓ All 6 HR pages present (index, Ferias, Exames, ValeTransporte, Calendario, Atestados)
✓ Sales modals present (CreditCardSaleModal, DPlusSaleModal, SaleReceipt)
✓ App.tsx routing added
✓ AppSidebar navigation added

## Testing Notes

- No test framework configured (per CLAUDE.md) — manual testing required
- Build passes (npm run build succeeds)
- ESLint: New code has no errors (pre-existing store/service errors noted separately)
