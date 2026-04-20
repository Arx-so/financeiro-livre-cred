# Sales Daily Report (Relatório de Vendas) — Technical Specification

**Version**: 1.0  
**Date**: 2026-04-11  
**Source Documents**: 
- RELATÓRIO DE VENDAS 2026.xlsx
- Detalhamento relatório vendas 2026.docx
- WhatsApp screenshots (client expectations)

**Status**: Ready for Development

---

## 1. Executive Summary

The client needs a **daily sales report screen** (`/vendas/relatorio`) that aggregates and displays both credit card sales (`sales_credit_card` table) and D+ product sales (`sales_d_plus_products` table) with detailed breakdowns by terminal, card brand, seller, and payment method. The report shows KPI cards at the top (totals, counts, fees) followed by detailed grouped tables, cash reconciliation section, and export-to-CSV functionality. The layout mirrors an existing Excel template used for manual daily close-of-business reporting.

---

## 2. Business Context & Objectives

**Problem Being Solved:**
- Sales team needs a daily view of all transaction activity (credit card + D+ products)
- Currently using a manual Excel template for daily reconciliation
- System should auto-calculate and display summaries without manual data entry
- Support close-of-day reconciliation workflow with cash tracking

**Expected Outcomes:**
- Single source of truth for daily sales data across all channels
- Reduced manual data entry and reconciliation time
- Audit trail of transactions by terminal, seller, and card brand
- Easy export to CSV or PDF for accounting department

**Affected User Roles:**
- Coordenador (branch coordinator) — views own unit's report
- Gerente (manager) — views across units
- Vendedor (seller) — views own transactions
- Financeiro (finance) — uses report for reconciliation
- Assistente (assistant) — generates and archives reports

---

## 3. Functional Requirements

### FR-001: Date Range Filter 🔴 CRITICAL
- User can filter report by **date range** (from date → to date)
- Defaults to **today's date** on page load
- Date picker: use existing date input component (calendar UI)
- Recalculates all summaries and tables when filter changes
- Query both `sales_credit_card.sale_date` and `sales_d_plus_products.sale_date`

### FR-002: Terminal Filter (Multi-select) 🟡 IMPORTANT
- User can filter by one or more terminals (SUMUP W, SUMUP R, SUMUP H, LARANJINHA H, C6 R, PAGUE VELOZ, MERCADO PAGO R, PAGBANK H)
- Use multi-select dropdown (like AdvancedFilters pattern in codebase)
- Empty = show all terminals
- When filtered: hide unused terminals from the breakdown tables
- Query `sales_credit_card.terminal`

### FR-003: Seller Filter (Multi-select) 🟡 IMPORTANT
- User can filter by one or more sellers
- Uses favorecidos name lookup (search by name or partial match)
- Empty = show all sellers
- Query `sales_credit_card.seller_id` and `sales_d_plus_products.seller_id`

### FR-004: Branch/Unit Scope 🔴 CRITICAL
- **All queries MUST be scoped by branch_id** from useBranchStore
- If user views report for Branch A, only show sales for Branch A
- No cross-branch data mixing
- Use branch context from `useBranchStore().selectedBranch?.id`

### FR-005: Summary KPI Cards at Top 🔴 CRITICAL
Display four StatCard components with real-time calculations:
1. **Total Valor de Venda** (Total Sale Value)
   - Label: "Total de Vendas"
   - Value: Sum of `sales_credit_card.sale_value` + `sales_d_plus_products.contract_value` (if commission counting both)
   - Currency: BRL formatted (1.234,56)
   - Icon: TrendingUp or similar

2. **Total Maquineta Amount** (Terminal/Machine Amount)
   - Label: "Valor Maquineta"
   - Value: Sum of `sales_credit_card.terminal_amount` only (D+ doesn't have terminal fees)
   - Currency: BRL formatted
   - Icon: CreditCard or similar

3. **Total Fee/Taxa** (Fees Charged)
   - Label: "Total de Taxas"
   - Value: Sum of (terminal_amount - sale_value) for all credit card sales
   - Shown separately from totals for reconciliation
   - Currency: BRL formatted
   - Icon: AlertCircle or similar

4. **Total Transactions Count**
   - Label: "Transações"
   - Value: Count of credit card sales + D+ sales
   - Icon: Hash or similar

### FR-006: Credit Card Sales Section — "Cartão de Crédito" 🔴 CRITICAL
Display detailed table with the following structure:

**Table Headers (in order):**
| Terminal | Bandeira (Brand) | Final Cartão | Valor Venda | Valor Maquineta | Taxa | Vendedor | Obs |

**Data Source**: `sales_credit_card` table  
**Grouping**: Group by terminal first, then by card_brand within terminal

**Row Data** (from sales_credit_card):
- `terminal` → Display using TERMINAL_LABELS constant
- `card_brand` → Display using CARD_BRAND_LABELS constant
- `card_final_digits` or similar field → Last 4 digits of card number (check DB schema)
- `sale_value` → Currency formatted
- `terminal_amount` → Currency formatted
- `terminal_amount - sale_value` → Calculated fee, currency formatted
- `seller?.name` → From relation to favorecidos table
- `notes` → From notes field

**Subtotals**: After each terminal group, show a subtotal row with:
- Terminal name in bold
- Sum of valor venda for that terminal
- Sum of valor maquineta for that terminal
- Sum of taxas for that terminal
- Blank for seller/obs

**Footer Row**: Grand total of all values (same columns as subtotal)

**Pagination/Limits**: Show max 50 rows per page; use pagination if needed

### FR-007: D+ Products Sales Section — "D+ Produtos" 🟡 IMPORTANT
Display table with structure:

**Table Headers:**
| Proposta | Banco | Valor Contrato | Vendedor | Obs |

**Data Source**: `sales_d_plus_products` table  
**Grouping**: Group by seller (if multiple sellers)

**Row Data** (from sales_d_plus_products):
- `proposal_number` → Proposal reference
- `bank_info` → Bank name or info (editable text field at entry time)
- `contract_value` → Currency formatted
- `seller?.name` → From relation
- `notes` → Notes field

**Subtotal**: Show sum of contract values by seller (if grouped)

**Footer Row**: Grand total of contract values

### FR-008: Aggregated Breakdown by Terminal 🟡 IMPORTANT
Display a summary table (not detailed rows, but aggregates) showing:

**Table Headers:**
| Terminal | Qtd (Count) | Valor Venda | Valor Maquineta | Taxa Total |

**Calculation Logic:**
- For each unique terminal in filtered data
- Count of sales for that terminal
- Sum of sale_value for that terminal
- Sum of terminal_amount for that terminal
- Sum of fees (terminal_amount - sale_value)

**Grouping**: One row per terminal, sorted by terminal name

### FR-009: Aggregated Breakdown by Card Brand 🟡 IMPORTANT
Display summary showing:

**Table Headers:**
| Bandeira | Qtd | Valor Venda | Valor Maquineta | Taxa Total |

**Calculation Logic:**
- For each unique card_brand in filtered credit card sales
- Count of sales per brand
- Sum values as per FR-008

**Grouping**: One row per brand, sorted by brand name

### FR-010: Aggregated Breakdown by Seller 🟡 IMPORTANT
Display summary showing:

**Table Headers:**
| Vendedor | Qtd CC | Valor CC | Qtd D+ | Valor D+ | Total Geral |

Where:
- Qtd CC = count of credit card sales by seller
- Valor CC = sum of credit card sale values
- Qtd D+ = count of D+ sales by seller
- Valor D+ = sum of D+ contract values
- Total Geral = Valor CC + Valor D+

**Grouping**: One row per seller

### FR-011: Cash Reconciliation Section 🟢 NICE-TO-HAVE
Display a read-only summary section showing:
- Início Espécie (Opening cash) — input field (user-entered for manual reporting)
- Entrada Espécie (Cash received from sales) — auto-calculated as sum of especie payment method
- Transfers In (TF Central, TF Renta, TF Ralf) — input fields (manual)
- Entrada Clientes (Client cash payments) — auto-calculated or manual
- Total Entrada (sum of all inflows)
- Saídas (Outflows) — input fields (manual list)
- Total Saídas (sum of outflows)
- Final Balance = (Opening + Inflows) - Outflows

**Data Persistence**: Currently read-only for display; could be enhanced to save to a separate `daily_reports` table in future

### FR-012: Export to CSV 🟡 IMPORTANT
- Button: "Exportar CSV"
- Exports detailed transaction table (all columns from FR-006 and FR-007)
- Filename: `relatorio_vendas_YYYY-MM-DD.csv`
- Include summary KPI cards as header comments
- Include date range and branch name in export
- Handle special characters (commas, quotes) properly in CSV

### FR-013: Print-Friendly Layout 🟢 NICE-TO-HAVE
- Add print button that hides filters/buttons and adjusts layout for A4/Letter page
- Maintain section breaks and subtotals
- Include timestamp of report generation

### FR-014: Real-time Summary Updates 🔴 CRITICAL
- When any filter changes (date, terminal, seller), **immediately recalculate all KPI cards and tables**
- No "Apply Filters" button needed; auto-refresh on change
- Show loading spinner during fetch if needed

### FR-015: Search/Quick Filter by Client Name or Document 🟢 NICE-TO-HAVE
- Allow search across client names in credit card sales
- Use existing SearchInput component pattern
- Filter displayed rows in real time (client-side if <1000 rows, server-side if larger)

---

## 4. Business Rules

### BR-001: Sale Value vs. Terminal Amount
- **Sale Value** (`sale_value`) = Amount agreed with client
- **Terminal Amount** (`terminal_amount`) = Amount charged to terminal (may include fees)
- **Fee** = terminal_amount - sale_value
- Fees are taken out at settlement; they do NOT appear as separate transactions in the ledger

### BR-002: Multi-table Aggregation
- Credit card sales and D+ sales are tracked separately but reported together
- Credit card sales show granular terminal/brand details
- D+ sales show proposal/bank details
- Both contribute to total transaction count and seller performance

### BR-003: Branch Isolation
- All data MUST be filtered by the user's selected branch
- A user logged into Branch A cannot see Branch B sales
- Even if two branches share a seller, only that branch's sales appear in the report

### BR-004: Date Scoping
- Use `sale_date` field (not `created_at`) for filtering
- `sale_date` represents when the transaction occurred (may differ from entry date)
- For D+ products, `sale_date` should also be recorded at entry time

### BR-005: Terminal Fees Are Branch-Agnostic
- Fee calculation is automatic: terminal_amount must be > sale_value
- No special fee scheduling or discounts per branch (at this stage)

### BR-006: Seller Attribution
- If a sale has no seller_id, it still appears in the report (e.g., "Unknown" or blank seller)
- Each sale is attributed to **exactly one** seller (not shared credit)

### BR-007: Cash Reconciliation Audit Trail
- Reconciliation section is for daily close-out use; reconciliation data may need to be saved separately
- Currently no persistent storage for daily reconciliation (could add `daily_reports` table in future)

---

## 5. Data Model

### Existing Tables Used

#### `sales_credit_card` (existing, DO NOT MODIFY)
```
id: UUID
branch_id: UUID (FK → branches)
sale_date: DATE
seller_id: UUID | NULL (FK → favorecidos)
client_id: UUID | NULL (FK → favorecidos)
terminal: VARCHAR (enum: sumup_w, sumup_r, sumup_h, laranjinha_h, c6_r, pague_veloz, mercado_pago_r, pagbank_h)
card_brand: VARCHAR (enum: master, visa, elo, amex, hiper)
card_final_digits: VARCHAR(4) OR VARCHAR(5) [CHECK DB SCHEMA]
payment_method: VARCHAR (enum: especie, pix, tec, pix_especie)
installments: INT (default: 1)
sale_value: DECIMAL(12, 2)
terminal_amount: DECIMAL(12, 2)
fee_rate: DECIMAL(5, 4) [OPTIONAL: may be calculated, not stored]
net_value: DECIMAL(12, 2) [may be used for reconciliation]
status: VARCHAR (enum: pendente, pago, cancelado)
notes: TEXT
financial_entries_generated: BOOLEAN
created_at: TIMESTAMP
[... other fields ...]
```

#### `sales_d_plus_products` (existing, DO NOT MODIFY)
```
id: UUID
branch_id: UUID (FK → branches)
sale_date: DATE
seller_id: UUID | NULL (FK → favorecidos)
client_id: UUID | NULL (FK → favorecidos)
proposal_number: VARCHAR
bank_info: VARCHAR
table_info: VARCHAR [may be related to rate table]
product_type: VARCHAR
contract_value: DECIMAL(12, 2)
commission_value: DECIMAL(12, 2)
status: VARCHAR (enum: pendente, ativo, cancelado)
notes: TEXT
financial_entries_generated: BOOLEAN
created_at: TIMESTAMP
[... other fields ...]
```

#### `favorecidos` (clients/sellers, existing)
```
id: UUID
branch_id: UUID
name: VARCHAR
document: VARCHAR (CPF/CNPJ)
phone: VARCHAR
[... other fields ...]
```

### Report Data Structure (In-Memory, No New Tables)

The report will construct these objects in-memory during the query lifecycle:

```typescript
interface SalesReportFilters {
    branchId: string;
    dateFrom: string; // YYYY-MM-DD
    dateTo: string;   // YYYY-MM-DD
    terminals?: string[]; // Empty = all
    sellerIds?: string[]; // Empty = all
}

interface SalesReportSummary {
    // KPI totals
    total_sale_value: number;
    total_terminal_amount: number;
    total_fee: number;
    total_transactions: number;
    
    // Detailed collections
    credit_card_sales: SalesCreditCardWithRelations[];
    dplus_sales: SalesDPlusWithRelations[];
    
    // Aggregates
    by_terminal: Record<string, {
        terminal: string;
        count: number;
        sale_value: number;
        terminal_amount: number;
        fee: number;
    }>;
    
    by_card_brand: Record<string, {
        brand: string;
        count: number;
        sale_value: number;
        terminal_amount: number;
        fee: number;
    }>;
    
    by_seller: Record<string, {
        seller_id: string;
        seller_name: string;
        cc_count: number;
        cc_value: number;
        dplus_count: number;
        dplus_value: number;
        total_value: number;
    }>;
}
```

---

## 6. User Interface Requirements

### Page Layout Structure
```
┌─ PageHeader ("Relatório de Vendas") ─────────────────────────┐
│                                                               │
├─ FILTERS ROW ─────────────────────────────────────────────────┤
│ [Date From] [Date To] [Terminal ▼] [Seller ▼] [Search Box]  │
│                                          [CSV Export] [Print] │
│                                                               │
├─ KPI CARDS (4 columns) ───────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ Total $ │ │ Maq. $  │ │ Taxas $ │ │ Qty     │           │
│ │ 1.234.56│ │ 1.500   │ │ 265,44  │ │ 12      │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                               │
├─ TAB NAVIGATION ──────────────────────────────────────────────┤
│ [Crédito] [D+ Produtos] [Terminal] [Bandeira] [Vendedor]    │
│           [Reconciliação]                                    │
│                                                               │
├─ TABLE CONTENT (varies by selected tab) ──────────────────────┤
│ (details below)                                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### UI Components to Use/Create

**Use Existing LivreCred Components:**
- `PageHeader` — top-level page title + breadcrumb
- `StatCard` — KPI summary cards
- `SearchInput` — client search
- `CurrencyInput` → or just `<input type="number">` for display (read-only)
- `AdvancedFilters` — terminal/seller multi-select pattern (or new custom component)
- `DataTable` or `<table>` with Shadcn styling

**Create New:**
- `SalesReportFilters` component — date + terminal + seller selectors
- `SalesReportTabs` — tab navigation (Credit Card / D+ / By Terminal / By Brand / By Seller / Cash)
- `CreditCardSalesTable` — detailed credit card transactions
- `DPlusSalesTable` — D+ product transactions
- `TerminalBreakdownTable` — aggregated by terminal
- `BrandBreakdownTable` — aggregated by brand
- `SellerBreakdownTable` — aggregated by seller
- `CashReconciliationSection` — manual input fields for cash management (nice-to-have)

### Page Navigation

**Route**: `/vendas/relatorio`  
**Parent**: Vendas (Sales module)  
**Access**: Coordenador, Gerente, Financeiro, Vendedor, Assistente (per role)

---

## 7. Integration Points

### Affected Services

1. **Create new service file**: `/src/services/salesReport.ts`
   - Function: `async getSalesReport(filters: SalesReportFilters): Promise<SalesReportSummary>`
   - Queries both `sales_credit_card` and `sales_d_plus_products`
   - Applies branch filtering
   - Returns aggregated data + detail arrays
   - Handles date/terminal/seller filtering

2. **Use existing services**:
   - `salesCreditCard.ts` — already has `getCreditCardSales()` and `getCreditCardSalesReport()` (may reuse or enhance)
   - `salesDPlus.ts` — already has `getDPlusSales()`
   - No changes to these files unless enhancing for new fields

### Create New Hook

**File**: `/src/hooks/useSalesReport.ts`
```typescript
interface UseSalesReportOptions {
    branchId: string;
    dateFrom: string;
    dateTo: string;
    terminals?: string[];
    sellerIds?: string[];
}

export function useSalesReport(options: UseSalesReportOptions) {
    return useQuery(
        ['salesReport', options],
        () => getSalesReport(options),
        {
            enabled: !!options.branchId,
            staleTime: 30000, // 30 sec
        }
    );
}
```

### Page File

**Create**: `/src/pages/Vendas/RelatorioVendas.tsx`
- Main page component
- Manage filters state (date range, terminal, seller)
- Call `useSalesReport` hook with current filters
- Render tabs + tables based on active tab
- Handle CSV export

### Integration with Existing Sales Pages

- Add menu item in Vendas module sidebar: "Relatório de Vendas"
- Link from sales list page to detailed report
- No changes to CreditCardSaleModal or DPlusSaleModal

---

## 8. Acceptance Criteria

### AC-001: Date Filter Works
**Given** a user views the sales report on 2026-04-11  
**When** they set date range to 2026-04-01 to 2026-04-10  
**Then** only sales with `sale_date` in that range appear, and KPI totals recalculate

### AC-002: Terminal Multi-Filter Works
**Given** user has credit card sales on SUMUP R and LARANJINHA H  
**When** they select only LARANJINHA H terminal  
**Then** table shows only LARANJINHA H rows and KPI cards reflect those values

### AC-003: Branch Isolation
**Given** two branches (Loja A, Loja B) with sales on same date  
**When** a user logged into Loja A views the report  
**Then** only Loja A sales appear (zero sales from Loja B)

### AC-004: KPI Cards Calculate Correctly
**Given** 2 credit card sales: R$1000 + R$500 = R$1500 (sale_value), R$1200 + R$600 = R$1800 (terminal_amount)  
**And** 1 D+ sale: R$2000 (contract_value)  
**When** viewing report for that date  
**Then**:
- Total de Vendas = R$1500 (credit card only, or R$3500 if including D+? — *clarify with client*)
- Valor Maquineta = R$1800
- Total de Taxas = (1800-1500) = R$300
- Transações = 3

### AC-005: CSV Export Contains All Data
**Given** user clicks "Exportar CSV"  
**When** file downloads  
**Then** it contains:
- Report header (date range, branch name)
- KPI summary
- All credit card transaction rows with columns: Terminal, Bandeira, Final Cartão, Valor Venda, Valor Maquineta, Taxa, Vendedor, Obs
- All D+ rows
- All summary tables (by terminal, brand, seller)

### AC-006: Seller Filter Works Across Both Sale Types
**Given** a seller has both credit card and D+ sales  
**When** filtering by that seller  
**Then** both types appear in the report and are included in their seller row total

### AC-007: Subtotals by Terminal Appear
**Given** sales data includes multiple card brands on SUMUP R  
**When** viewing Credit Card tab  
**Then** after all SUMUP R rows, a subtotal row shows sum of that terminal's values

### AC-008: Real-time Filter Updates
**Given** filters are visible on page  
**When** user changes date range (without clicking Apply)  
**Then** within <1 second, KPI cards and tables update to reflect new data

### AC-009: Empty State Handling
**Given** user filters to a date range with no sales  
**When** viewing the report  
**Then** tables show "Nenhuma venda encontrada" (No sales found) and KPI cards show zero

### AC-010: Currency Formatting
**Given** all monetary values in database  
**When** displayed on report  
**Then** formatted as Brazilian Real: R$ 1.234,56 (dot for thousands, comma for decimals)

---

## 9. Out of Scope

- **Editing transactions directly from report** — transactions are created via sales form, not edited here
- **Deleting transactions** — done through sales form; report is read-only
- **Custom date ranges other than from/to** — no "last 7 days" quick filters
- **Budgeting or forecasting** — report is backward-looking only
- **Photo/receipt attachments** — existing in sales forms, not shown in report
- **Financial entry generation** — separate feature; report is for review only
- **Multi-tenant (cross-branch) reports** — each report is branch-scoped; no "all branches" view for non-admins
- **Real-time WebSocket updates** — report fetches on demand; no live push updates
- **PDF export** — CSV only for now; PDF can be added in v1.1

---

## 10. Assumptions Made

1. **`card_final_digits` field exists** in `sales_credit_card` table — if it's stored differently (e.g., `card_number`), adjust mapping
2. **`sale_date` is always populated** for both sale types — if missing, fall back to `created_at.split('T')[0]`
3. **Seller can be NULL** — report handles null sellers gracefully (shows "Sem vendedor" or "-")
4. **Terminal and Card Brand enums are exact** matches to constants in `src/constants/sales.ts` — any new terminals must be added there first
5. **Fee calculation**: terminal_amount > sale_value always holds (no negative/zero fees) — if not, validation required at entry
6. **Report is for same-branch user** — no admin override for cross-branch viewing in this sprint
7. **Cash reconciliation section is optional display-only** — actual reconciliation data is not persisted (future enhancement)
8. **Pagination starts at 50 rows per table** — if client wants larger limit, adjust constant
9. **D+ `contract_value` represents gross commission** — not split into installments (unlike credit card)
10. **No real-time data refresh** — user must refresh page to see new sales (no WebSocket polling)

---

## 11. Open Questions / Blockers

1. **D+ vs CC in "Total de Vendas" KPI**: Should the top-left KPI card show only credit card `sale_value`, or should it include D+ `contract_value`? 
   - *Proposed Answer*: Show only credit card sale_value (VALOR CLIENTE column in Excel) as the primary "sales" metric; D+ is "commissions" (separate KPI?)
   - **ACTION**: Confirm with client

2. **Installments handling**: Credit card sales can have installments (parcela = 2, 3, 12). Should the report show gross amount or per-installment? Should it aggregate installments for a single sale?
   - *Proposed Answer*: Show total per sale (1 row per transaction, regardless of installments); installments field is metadata
   - **ACTION**: Confirm with client

3. **`card_final_digits` storage**: What is the exact field name and data type in `sales_credit_card` for the last 4 digits of the card? Is it `card_final_digits`, `card_last_four`, or stored in `card_number` (last 4 extracted)?
   - **ACTION**: Check database schema in Supabase

4. **Net value (`net_value`)**: What does this field represent? Is it sale_value - some fees? Should it appear in the report?
   - *Proposed Answer*: Keep internal; don't display it unless clarified
   - **ACTION**: Confirm with client

5. **Cash reconciliation persistence**: Should the manual entries (Início Espécie, Transferências, Saídas) be saved to a new `daily_reports` table, or are they just display-only for current session?
   - *Proposed Answer*: Display-only for now; can add persistence in v1.1
   - **ACTION**: Confirm with client

6. **Time-of-day filtering**: Should the report filter by time (e.g., sales between 09:00 and 17:00) or just by date?
   - *Proposed Answer*: Date only; time is not needed
   - **ACTION**: Confirm with client

7. **Seller attribution for D+ sales**: In the Excel template, is there a "VENDEDOR" column for D+ products? If so, how is it tracked differently from CC sales?
   - **ACTION**: Check D+ sales form to see if seller field exists

8. **Bandeira filters**: Should there be a filter for card brands (MASTER, VISA, ELO, etc.) in addition to terminals?
   - *Proposed Answer*: No filter needed; card brand appears in table and summary only
   - **ACTION**: Confirm with client

9. **Export filename and format**: Should CSV export include all columns from all tables, or just the active tab's data?
   - *Proposed Answer*: Export all detailed sales data (full CC + D+ tables) + summary sections
   - **ACTION**: Confirm with client

---

## 12. Technical Notes for Developer

### Architecture & Patterns

1. **Data Flow**:
   - Page → Hook (`useSalesReport`) → Service (`getSalesReport`) → Supabase (both tables) → Aggregation in-memory → Component state

2. **State Management**:
   - Filters (date, terminal, seller) in local `useState`
   - Report data fetched via React Query (`useSalesReport` hook)
   - No global Zustand store needed (filters are page-local)

3. **Service Function Strategy**:
   - Create `/src/services/salesReport.ts` with main function:
     ```typescript
     export async function getSalesReport(filters: SalesReportFilters): Promise<SalesReportSummary> {
         // 1. Fetch credit card sales using getCreditCardSales() from salesCreditCard.ts
         // 2. Fetch D+ sales using getDPlusSales() from salesDPlus.ts
         // 3. Aggregate both into summary object
         // 4. Return summary
     }
     ```
   - Reuse existing fetch functions; don't duplicate queries

4. **Aggregation Logic** (in service):
   - Build Maps for by_terminal, by_card_brand, by_seller
   - Iterate over sales arrays, updating Maps
   - Convert Maps to Record<string, T> for serialization
   - Calculate KPI totals from aggregates (or from detail arrays)

5. **Performance Considerations**:
   - If date range includes >10K transactions, consider pagination or limits
   - Current assumption: typical daily report = <1K transactions (manageable in-memory)
   - Use React Query's caching to avoid re-fetching during filter toggles (same date range)

6. **TypeScript Alignment**:
   - Reuse `SalesCreditCardWithRelations` and `SalesDPlusWithRelations` types from existing services
   - Define new `SalesReportSummary` interface (see Data Model section)
   - Ensure all numeric fields are `number` type (not strings)

7. **Currency Handling**:
   - Store as `number` in-memory (already is in DB)
   - Format for display using utility: `formatCurrency(value)` (check if exists in codebase, else create)
   - CSV export: use locale-aware formatting or plain numbers with instructions

8. **CSV Export Implementation**:
   - Use npm package like `papaparse` or `csv-stringify` (if not already in deps)
   - Or hand-build CSV string (simple but fragile)
   - Include BOM for Excel UTF-8 compatibility
   - Filename: `relatorio_vendas_${branchName}_${dateFrom}_${dateTo}.csv`

9. **Responsive Layout**:
   - KPI cards: 4 columns on desktop, 2x2 on tablet, 1 column on mobile
   - Tables: horizontal scroll on mobile (or collapse to card view)
   - Use Tailwind grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

10. **Error Handling**:
    - If `getCreditCardSales()` throws, show error toast + empty state
    - If D+ fetch fails, show D+ section as unavailable (but show CC data)
    - Use try/catch in service; let hook handle error display

11. **Branch Filtering**:
    - Always prepend `.eq('branch_id', branchId)` to every Supabase query
    - Get branchId from: `const branch = useBranchStore().selectedBranch; const branchId = branch?.id;`
    - Show branch name in page title or header: "Relatório de Vendas - [Branch Name]"

12. **Dates in Supabase**:
    - `sale_date` is likely a DATE type (YYYY-MM-DD)
    - Use `.gte('sale_date', dateFrom).lte('sale_date', dateTo)` for range query
    - No time component needed

13. **Sellers Without Names**:
    - If `seller_id` is not null but `seller?.name` is null, display seller ID or "[Sem Vendedor]"
    - Graceful degradation in seller summary table

14. **Future Enhancements** (out of scope now, but plan for):
    - Save daily reports to `daily_reports` table (audit trail)
    - Add time-of-day breakdown (hourly chart)
    - Compare to previous day/week/month (trend chart)
    - Alert if certain KPI exceeds threshold
    - Role-based column visibility (Finance sees different columns than Sales)

---

## 13. File Structure & Deliverables

### New Files to Create

```
src/
├── services/
│   └── salesReport.ts (new) — Main report aggregation logic
│
├── hooks/
│   └── useSalesReport.ts (new) — React Query wrapper
│
├── pages/
│   └── Vendas/
│       └── RelatorioVendas.tsx (new) — Main page component
│
└── components/
    └── sales-report/ (new folder)
        ├── SalesReportFilters.tsx
        ├── KPICards.tsx
        ├── ReportTabs.tsx
        ├── CreditCardTable.tsx
        ├── DPlusTable.tsx
        ├── TerminalBreakdownTable.tsx
        ├── BrandBreakdownTable.tsx
        ├── SellerBreakdownTable.tsx
        └── CashReconciliationSection.tsx (optional)
```

### Modified Files

- **`src/App.tsx`** — Add route for `/vendas/relatorio`
- **`src/constants/sales.ts`** — No changes (already complete)

### No Changes to

- Database tables (existing schema used as-is)
- `salesCreditCard.ts` (functions reused, not modified)
- `salesDPlus.ts` (functions reused, not modified)

---

## 14. Development Checklist

- [ ] Create `/src/services/salesReport.ts` with `getSalesReport()` function
- [ ] Create `/src/hooks/useSalesReport.ts` with React Query integration
- [ ] Create `/src/pages/Vendas/RelatorioVendas.tsx` main page
- [ ] Create `/src/components/sales-report/` folder + 8 sub-components
- [ ] Implement date range filter (from/to picker)
- [ ] Implement terminal multi-select filter
- [ ] Implement seller multi-select filter
- [ ] Implement branch isolation (ensure all queries include branch_id)
- [ ] Build KPI cards with real-time calculations
- [ ] Build Credit Card sales table with grouping and subtotals
- [ ] Build D+ sales table
- [ ] Build Terminal breakdown summary
- [ ] Build Brand breakdown summary
- [ ] Build Seller breakdown summary
- [ ] Implement tab navigation
- [ ] Implement CSV export
- [ ] Test with 10+ transactions per terminal
- [ ] Test with null sellers
- [ ] Test with empty date range
- [ ] Test cross-branch isolation
- [ ] Test responsive layout on mobile/tablet
- [ ] Verify currency formatting (BRL)
- [ ] Add error handling + user feedback
- [ ] Performance: measure query time with 1K rows
- [ ] Documentation: add JSDoc comments
- [ ] Code review & testing in staging

---

## Appendix A: Excel Template Reference

### Sections from RELATÓRIO DE VENDAS 2026.xlsx

1. **Maquinetas Utilizadas** (Terminals Used Today)
2. **Total Empréstimos** (Total Loans)
3. **Detalhamento das Maquinetas** (Terminal Detail)
   - Valor, Bandeira, Final Cartão, Parcela, Obs columns
4. **Saídas** (Outflows)
5. **Descontos** (Discounts)
6. **Total de Saídas** (Total Outflows)
7. **Valor Final** (Final Balance)
8. **Controle de Espécie** (Cash Control)
   - Início Espécie, Entrada Espécie, Transferências, Entrada Clientes, Entrada Unidades
9. **Vendedor x Maquineta Cross-tab** (Seller x Terminal Matrix)
10. **Lacre & Devolução Sábado** (Close-of-day items)

**Note**: LivreCred report focuses on sections 3, 4 (aggregated), 8 (read-only display), 9. Sections 1, 2, 5, 6, 7, 10 can be added in future if needed.

---

**Document Version History:**
- v1.0 (2026-04-11): Initial spec extracted from client documents
