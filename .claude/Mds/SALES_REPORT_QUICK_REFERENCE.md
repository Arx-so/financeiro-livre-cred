# Sales Report (`/vendas/relatorio`) — Quick Reference

**Status**: Ready for Development  
**Estimated Effort**: 40-60 hours  
**Dependencies**: Existing sales_credit_card + sales_d_plus_products tables  

---

## What to Build

A daily sales aggregation report page showing transaction details, KPI summaries, and seller performance for credit card and D+ product sales.

### Key Features (MVP)

| Feature | Priority | Effort |
|---------|----------|--------|
| Date range filter (from/to) | CRITICAL | 2h |
| Terminal multi-select filter | IMPORTANT | 3h |
| Seller multi-select filter | IMPORTANT | 3h |
| KPI cards (4: Total, Maq, Fee, Qty) | CRITICAL | 3h |
| Credit card sales table (grouped) | CRITICAL | 6h |
| D+ sales table | IMPORTANT | 4h |
| Terminal breakdown summary | IMPORTANT | 3h |
| Card brand breakdown summary | IMPORTANT | 3h |
| Seller breakdown summary | IMPORTANT | 3h |
| Tab navigation | CRITICAL | 2h |
| CSV export | IMPORTANT | 4h |
| Branch isolation (all queries) | CRITICAL | 2h |
| Responsive layout | IMPORTANT | 3h |
| Error handling + empty states | IMPORTANT | 3h |

**Total MVP**: ~45-50 hours

---

## Data Sources

### Tables

**`sales_credit_card`** (credit card transactions)
- branch_id, sale_date, seller_id, client_id
- terminal (8 options: sumup_w, sumup_r, sumup_h, laranjinha_h, c6_r, pague_veloz, mercado_pago_r, pagbank_h)
- card_brand (5 options: master, visa, elo, amex, hiper)
- card_final_digits (last 4 digits)
- sale_value, terminal_amount (fee = terminal_amount - sale_value)
- payment_method (especie, pix, tec, pix_especie)

**`sales_d_plus_products`** (D+ product sales / commissions)
- branch_id, sale_date, seller_id, client_id
- proposal_number, bank_info, contract_value

### Joins

Both sale types include `client` and `seller` from `favorecidos` table (name, document, phone).

---

## KPI Cards (Top Section)

```
┌─────────────────┬──────────────────┬──────────────┬────────────┐
│  Total de       │  Valor           │  Total de    │ Transações │
│  Vendas         │  Maquineta       │  Taxas       │            │
│  R$ 12.500,00   │  R$ 12.800,00    │  R$ 300,00   │ 5          │
└─────────────────┴──────────────────┴──────────────┴────────────┘

Calculations:
- Total de Vendas = SUM(sales_credit_card.sale_value) [CC ONLY]
- Valor Maquineta = SUM(sales_credit_card.terminal_amount)
- Total de Taxas = SUM(terminal_amount - sale_value) for all CC
- Transações = COUNT(CC) + COUNT(D+)
```

---

## Tables

### Tab 1: Cartão de Crédito (Credit Card Detail)

| Terminal | Bandeira | Final | Valor Venda | Valor Maquineta | Taxa | Vendedor | Obs |
|----------|----------|-------|-------------|-----------------|------|----------|-----|
| LARANJ. H | MASTER | 1234 | 500,00 | 550,00 | 50,00 | João | - |
| LARANJ. H | VISA | 5678 | 300,00 | 330,00 | 30,00 | João | - |
| **LARANJ. H Subtotal** | | | **800,00** | **880,00** | **80,00** | | |
| SUMUP R | MASTER | 9999 | 200,00 | 220,00 | 20,00 | Maria | - |
| **SUMUP R Subtotal** | | | **200,00** | **220,00** | **20,00** | | |
| **TOTAL** | | | **1.000,00** | **1.100,00** | **100,00** | | |

**Grouping**: Terminal → Card Brand (hierarchy)

### Tab 2: D+ Produtos

| Proposta | Banco | Valor Contrato | Vendedor | Obs |
|----------|-------|-----------------|----------|-----|
| PRO-001 | Itaú | 5.000,00 | João | - |
| PRO-002 | Caixa | 3.000,00 | Maria | - |
| **TOTAL** | | **8.000,00** | | |

**Grouping**: By seller (if multiple)

### Tab 3: Terminal (Summary)

| Terminal | Qtd | Valor Venda | Valor Maquineta | Taxa Total |
|----------|-----|-------------|-----------------|-----------|
| LARANJ. H | 2 | 800,00 | 880,00 | 80,00 |
| SUMUP R | 1 | 200,00 | 220,00 | 20,00 |
| **TOTAL** | 3 | 1.000,00 | 1.100,00 | 100,00 |

### Tab 4: Bandeira (Card Brand Summary)

| Bandeira | Qtd | Valor Venda | Valor Maquineta | Taxa Total |
|----------|-----|-------------|-----------------|-----------|
| MASTER | 2 | 700,00 | 770,00 | 70,00 |
| VISA | 1 | 300,00 | 330,00 | 30,00 |
| **TOTAL** | 3 | 1.000,00 | 1.100,00 | 100,00 |

### Tab 5: Vendedor (Seller Summary)

| Vendedor | Qtd CC | Valor CC | Qtd D+ | Valor D+ | Total Geral |
|----------|--------|----------|--------|----------|-------------|
| João | 2 | 800,00 | 1 | 5.000,00 | 5.800,00 |
| Maria | 1 | 200,00 | 1 | 3.000,00 | 3.200,00 |
| **TOTAL** | 3 | 1.000,00 | 2 | 8.000,00 | 9.000,00 |

---

## Filters (Top Row)

```
[Date From: ________] [Date To: ________] [Terminal ▼] [Seller ▼] [Search: ________] [CSV↓] [Print]
```

- **Date From / To**: Date picker (defaults to today)
- **Terminal**: Multi-select (show only used terminals)
- **Seller**: Multi-select (search by name)
- **Search**: Client name search (client-side filter)
- **CSV**: Exports all detail tables + KPI summary
- **Print**: Print-friendly layout

---

## Service Function Signature

```typescript
// src/services/salesReport.ts

interface SalesReportFilters {
    branchId: string;
    dateFrom: string; // "YYYY-MM-DD"
    dateTo: string;
    terminals?: string[];
    sellerIds?: string[];
}

interface SalesReportSummary {
    // KPI totals
    total_sale_value: number;
    total_terminal_amount: number;
    total_fee: number;
    total_transactions: number;
    
    // Detailed arrays
    credit_card_sales: SalesCreditCardWithRelations[];
    dplus_sales: SalesDPlusWithRelations[];
    
    // Aggregated summaries
    by_terminal: Record<string, TerminalSummary>;
    by_card_brand: Record<string, BrandSummary>;
    by_seller: Record<string, SellerSummary>;
}

export async function getSalesReport(
    filters: SalesReportFilters
): Promise<SalesReportSummary> {
    // 1. Call getCreditCardSales() with filters
    // 2. Call getDPlusSales() with filters
    // 3. Aggregate into summary
    // 4. Return
}
```

---

## Hook Usage

```typescript
// src/hooks/useSalesReport.ts

export function useSalesReport(options: SalesReportFilters) {
    return useQuery(
        ['salesReport', options],
        () => getSalesReport(options),
        { enabled: !!options.branchId, staleTime: 30000 }
    );
}
```

**In component:**
```typescript
const { data, isLoading, error } = useSalesReport({
    branchId: branch.id,
    dateFrom: '2026-04-11',
    dateTo: '2026-04-11',
    terminals: filters.terminals,
    sellerIds: filters.sellers,
});
```

---

## Component Structure

```
RelatorioVendas.tsx (page)
  ├── SalesReportFilters (date, terminal, seller inputs)
  ├── KPICards (4 summary cards)
  ├── ReportTabs (tab navigation)
  └── [Active Tab Content]
      ├── CreditCardTable
      ├── DPlusTable
      ├── TerminalBreakdownTable
      ├── BrandBreakdownTable
      ├── SellerBreakdownTable
      └── CashReconciliationSection (optional)
```

---

## Key Business Rules (Checklist)

- [ ] **Branch isolation**: All queries filtered by `branch_id` (no cross-branch data)
- [ ] **Sale value vs. Terminal amount**: terminal_amount ≥ sale_value; fee = difference
- [ ] **Fee calculation**: Automatic, never negative
- [ ] **Seller can be NULL**: Handle gracefully in tables (show "-" or "Unknown")
- [ ] **Terminal enum**: Must match TERMINALS in `src/constants/sales.ts`
- [ ] **Card brand enum**: Must match CARD_BRANDS in constants
- [ ] **Date filtering**: Use `sale_date`, not `created_at`
- [ ] **Null sellers**: May appear in any row; aggregation handles them
- [ ] **No editing from report**: Report is read-only

---

## Testing Checklist

- [ ] Single date (today): shows correct totals
- [ ] Date range: correctly filters before/after dates
- [ ] Empty date range: shows "No sales" message
- [ ] Terminal filter: reduces count and totals
- [ ] Seller filter: filters both CC and D+
- [ ] Multi-terminal filter: combines totals correctly
- [ ] Subtotals: match sum of detail rows
- [ ] Grand total: matches sum of subtotals
- [ ] KPI cards: update on every filter change
- [ ] Null sellers: don't cause crashes
- [ ] CSV export: valid format, includes all rows
- [ ] Branch isolation: only shows current branch data
- [ ] Currency format: R$ 1.234,56 (dot thousands, comma decimal)
- [ ] Responsive: works on 320px, 768px, 1920px widths
- [ ] Loading state: shows spinner during fetch
- [ ] Error state: shows error message if query fails

---

## Files to Create

1. `src/services/salesReport.ts` — Main service function
2. `src/hooks/useSalesReport.ts` — React Query hook
3. `src/pages/Vendas/RelatorioVendas.tsx` — Main page
4. `src/components/sales-report/SalesReportFilters.tsx`
5. `src/components/sales-report/KPICards.tsx`
6. `src/components/sales-report/ReportTabs.tsx`
7. `src/components/sales-report/CreditCardTable.tsx`
8. `src/components/sales-report/DPlusTable.tsx`
9. `src/components/sales-report/TerminalBreakdownTable.tsx`
10. `src/components/sales-report/BrandBreakdownTable.tsx`
11. `src/components/sales-report/SellerBreakdownTable.tsx`

**Modify**:
- `src/App.tsx` — Add route for `/vendas/relatorio`

---

## Route

- **Path**: `/vendas/relatorio`
- **Access**: Coordenador, Gerente, Financeiro, Vendedor, Assistente
- **Breadcrumb**: Vendas > Relatório de Vendas
- **Layout**: `AppLayout` wrapper

---

## Open Questions for Client

1. Should **Total de Vendas** KPI include D+ contract_value or only credit card sale_value?
2. Should the report support **historical data** (past months) or just current day?
3. Is **cash reconciliation section** needed (Início Espécie, Transferências, Saídas) or just the sales summary?
4. Should the **CSV include all sections** (detail + summaries) or just detail rows?
5. Do you want a **PDF export** option or just CSV?

---

**Full spec**: See `TECHNICAL_SPEC_SALES_REPORT.md`
