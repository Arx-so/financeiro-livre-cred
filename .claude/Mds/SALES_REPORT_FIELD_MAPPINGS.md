# Sales Report — Field Mappings & Column Reference

**Purpose**: Precise mapping of database fields to report columns  
**Last Updated**: 2026-04-11

---

## Credit Card Sales (`sales_credit_card` table) → Report Columns

### Detail Table: Cartão de Crédito (Credit Card)

| Report Column | DB Field | Type | Example | Notes |
|---------------|----------|------|---------|-------|
| Terminal | `terminal` | VARCHAR | `laranjinha_h` | Map via TERMINAL_LABELS; display "Laranjinha H" |
| Bandeira | `card_brand` | VARCHAR | `master` | Map via CARD_BRAND_LABELS; display "Mastercard" |
| Final Cartão | `card_final_digits` | VARCHAR(4-5) | `1234` | Last 4-5 digits of card; **CONFIRM field name** |
| Parcela | `installments` | INT | `1` | **Check if field exists; may be 0 if absent** |
| Valor Venda | `sale_value` | DECIMAL(12,2) | `1000.00` | Format: R$ 1.000,00 |
| Valor Maquineta | `terminal_amount` | DECIMAL(12,2) | `1100.00` | Format: R$ 1.100,00 |
| Taxa | `terminal_amount - sale_value` | DECIMAL | `100.00` | **Calculated field**; format: R$ 100,00 |
| Vendedor | `seller.name` (from favorecidos) | VARCHAR | `João Silva` | Join via seller_id; null = "-" or "Sem Vendedor" |
| Obs | `notes` | TEXT | `Parcela única` | Nullable; empty = "-" |

### KPI Summary Fields (Credit Card Only)

| KPI Card | Calculation | Notes |
|----------|-------------|-------|
| Total Valor Venda (left/total only) | SUM(`sale_value`) for all CC in filter | Do NOT include D+ here (separate KPI?) |
| Valor Maquineta | SUM(`terminal_amount`) for all CC | Credit card only |
| Total de Taxas | SUM(`terminal_amount - sale_value`) for all CC | Calculated per-transaction |

### Grouping in Detail Table

**Primary Group**: `terminal` (sorted alphabetically)  
**Secondary Group**: `card_brand` (within each terminal, sorted alphabetically)

Example:
```
LARANJINHA H
  MASTER (sorted by card_final_digits)
    [row 1]
    [row 2]
  VISA
    [row 3]
  [Subtotal: LARANJINHA H]
SUMUP R
  MASTERCARD
    [row 4]
  [Subtotal: SUMUP R]
[GRAND TOTAL]
```

### Filters Applied to CC Queries

```typescript
let query = supabase
    .from('sales_credit_card')
    .select('...with relations...')
    .eq('branch_id', filters.branchId)
    .gte('sale_date', filters.dateFrom)
    .lte('sale_date', filters.dateTo);

if (filters.terminals?.length > 0) {
    query = query.in('terminal', filters.terminals);
}
if (filters.sellerIds?.length > 0) {
    query = query.in('seller_id', filters.sellerIds);
}
```

---

## D+ Products (`sales_d_plus_products` table) → Report Columns

### Detail Table: D+ Produtos

| Report Column | DB Field | Type | Example | Notes |
|---------------|----------|------|---------|-------|
| Proposta | `proposal_number` | VARCHAR | `PRO-2026-001` | Text field; searchable |
| Banco | `bank_info` | VARCHAR | `Itaú` | Nullable; empty = "-" |
| Tabela | `table_info` | VARCHAR | `TAB-001` | May relate to rate table; optional |
| Valor Contrato | `contract_value` | DECIMAL(12,2) | `5000.00` | Format: R$ 5.000,00 |
| Comissão | `commission_value` | DECIMAL(12,2) | `500.00` | Metadata; **may not display in main table** |
| Vendedor | `seller.name` (from favorecidos) | VARCHAR | `João Silva` | Join via seller_id; null = "-" |
| Obs | `notes` | TEXT | `Incluso documentação` | Nullable; empty = "-" |

### KPI Summary Fields (D+ Only)

| KPI Card | Calculation | Notes |
|----------|-------------|-------|
| (Optional) Total D+ Valor | SUM(`contract_value`) for all D+ | **UNCLEAR**: Should this be separate KPI card or combined with CC? |
| Transações (count) | COUNT(CC) + COUNT(D+) | Combined count in single KPI |

### Grouping in Detail Table

**Primary Group**: `seller_id` (if multiple sellers)  
Example:
```
João Silva
  [row 1: PRO-001]
  [row 2: PRO-002]
  [Subtotal: João Silva]
Maria Santos
  [row 3: PRO-003]
  [Subtotal: Maria Santos]
[GRAND TOTAL]
```

### Filters Applied to D+ Queries

```typescript
let query = supabase
    .from('sales_d_plus_products')
    .select('...with relations...')
    .eq('branch_id', filters.branchId)
    .gte('sale_date', filters.dateFrom)
    .lte('sale_date', filters.dateTo);

if (filters.sellerIds?.length > 0) {
    query = query.in('seller_id', filters.sellerIds);
}
```

---

## Terminal Breakdown Summary

| Column | Source | Calculation |
|--------|--------|-------------|
| Terminal | `sales_credit_card.terminal` | Grouped key |
| Qtd (Count) | COUNT(*) | Number of CC sales for that terminal |
| Valor Venda | SUM(`sales_credit_card.sale_value`) | Total sale value for that terminal |
| Valor Maquineta | SUM(`sales_credit_card.terminal_amount`) | Total terminal amount |
| Taxa Total | SUM(`terminal_amount - sale_value`) | Total fees charged |

**Data Source**: Credit card sales only (D+ has no terminal)  
**Grouping**: One row per terminal  
**Sorting**: Alphabetical by terminal name

---

## Card Brand Breakdown Summary

| Column | Source | Calculation |
|--------|--------|-------------|
| Bandeira (Brand) | `sales_credit_card.card_brand` | Grouped key |
| Qtd (Count) | COUNT(*) | Number of sales for that brand |
| Valor Venda | SUM(`sales_credit_card.sale_value`) | Total for that brand |
| Valor Maquineta | SUM(`sales_credit_card.terminal_amount`) | Total for that brand |
| Taxa Total | SUM(`terminal_amount - sale_value`) | Total fees for that brand |

**Data Source**: Credit card sales only  
**Grouping**: One row per card brand  
**Sorting**: Alphabetical by brand

---

## Seller Breakdown Summary

| Column | Source | Calculation |
|--------|--------|-------------|
| Vendedor (Seller Name) | `favorecidos.name` | Grouped by seller_id |
| Qtd CC | COUNT(sales_credit_card.*) where seller_id matches | Count of CC sales |
| Valor CC | SUM(sales_credit_card.sale_value) | Sum of CC sale values |
| Qtd D+ | COUNT(sales_d_plus_products.*) where seller_id matches | Count of D+ sales |
| Valor D+ | SUM(sales_d_plus_products.contract_value) | Sum of D+ contract values |
| Total Geral | Valor CC + Valor D+ | Grand total per seller |

**Data Source**: Both CC and D+ sales, joined at seller_id  
**Grouping**: One row per unique seller_id  
**Sorting**: Alphabetical by seller name; "Unknown" or null sellers at bottom  
**Handling Null Sellers**: If seller_id is not null but seller.name is null, display seller_id or "[Sem Vendedor]"

---

## KPI Cards (Top Summary)

### Card 1: Total de Vendas (Total Sales Value)

```
Label: "Total de Vendas"
Value: SUM(sales_credit_card.sale_value) [all filtered CC]
  + potentially SUM(sales_d_plus_products.contract_value) if included
Format: "R$ 12.345,67"
Icon: TrendingUp or DollarSign
⚠️ CLARIFY WITH CLIENT: Include D+ or CC only?
```

### Card 2: Valor Maquineta (Terminal Amount)

```
Label: "Valor Maquineta"
Value: SUM(sales_credit_card.terminal_amount)
Format: "R$ 12.345,67"
Icon: CreditCard
Note: This is the actual amount charged to the terminal/machine
```

### Card 3: Total de Taxas (Total Fees)

```
Label: "Total de Taxas"
Value: SUM(sales_credit_card.terminal_amount - sales_credit_card.sale_value)
Format: "R$ 345,67"
Icon: AlertCircle or Fee
Note: Difference between terminal amount and sale value
```

### Card 4: Transações (Transaction Count)

```
Label: "Transações"
Value: COUNT(sales_credit_card.*) + COUNT(sales_d_plus_products.*)
Format: "12" (integer)
Icon: Hash or Hash-alt
Note: Combined count of both sale types
```

---

## Constants & Enumerations

### TERMINALS (from `src/constants/sales.ts`)

```typescript
{
    sumup_w: 'Sumup W',
    sumup_r: 'Sumup R',
    sumup_h: 'Sumup H',
    laranjinha_h: 'Laranjinha H',
    c6_r: 'C6 R',
    pague_veloz: 'Pague Veloz',
    mercado_pago_r: 'Mercado Pago R',
    pagbank_h: 'Pagbank H',
}
```

**Usage**: `TERMINAL_LABELS[terminal]` to display label

### CARD_BRANDS (from `src/constants/sales.ts`)

```typescript
{
    master: 'Mastercard',
    visa: 'Visa',
    elo: 'Elo',
    amex: 'American Express',
    hiper: 'Hipercard',
}
```

**Usage**: `CARD_BRAND_LABELS[card_brand]` to display label

### PAYMENT_METHODS (from `src/constants/sales.ts`)

```typescript
{
    especie: 'Espécie (Dinheiro)',
    pix: 'PIX',
    tec: 'TEC (Transferência)',
    pix_especie: 'PIX | Espécie',
}
```

**Usage**: For filtering/display (not primary grouping in report)

---

## Filter Dropdown Options

### Terminal Multi-Select

**Source**: Dynamically generated from unique `sales_credit_card.terminal` values in filtered date range  
**Options**: All 8 TERMINALS constants  
**Default**: All selected (empty = no filter)  
**Label**: "Maquineta" or "Terminal"

### Seller Multi-Select

**Source**: Dynamically generated from unique `seller_id` values in both tables (joined to favorecidos)  
**Search**: Allow filtering by seller name  
**Default**: All selected  
**Label**: "Vendedor"  
**Null Handling**: Include "[Sem Vendedor]" option if null sellers exist

### Date Range

**From Date**: Date picker input (defaults to today)  
**To Date**: Date picker input (defaults to today)  
**Format**: YYYY-MM-DD  
**Label**: "Data De" / "Data Até" or "De" / "Até"

---

## Currency Formatting

**All monetary values** formatted as **Brazilian Real (BRL)**:

```
Format: R$ 1.234,56
  - Prefix: "R$ "
  - Thousands separator: "." (dot)
  - Decimal separator: "," (comma)
  - Decimals: Always 2

Examples:
  1000 → "R$ 1.000,00"
  1234.567 → "R$ 1.234,57" (rounded)
  0 → "R$ 0,00"
  -100 → "R$ -100,00" (if negatives possible)
```

**Implementation**:
```typescript
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
```

Or use existing utility if available in codebase.

---

## Date Filtering

**Query Logic**:
```typescript
.gte('sale_date', filters.dateFrom)     // sale_date >= 2026-04-11
.lte('sale_date', filters.dateTo)       // sale_date <= 2026-04-11
```

**Field**: Use `sale_date` (not `created_at`)  
**Type**: DATE (YYYY-MM-DD)  
**Default Filter**: Today's date (same dateFrom and dateTo)

---

## Branch Filtering (CRITICAL)

**ALL queries MUST include**:
```typescript
.eq('branch_id', filters.branchId)
```

**Source of branchId**:
```typescript
const { selectedBranch } = useBranchStore();
const branchId = selectedBranch?.id;
```

**Consequence**: If branch_id is omitted, audit trail breaks and multi-tenant isolation is violated.

---

## Null/Empty Handling

| Field | If Null/Empty | Display As | Notes |
|-------|---------------|-----------|-------|
| seller.name | NULL | "-" or "[Sem Vendedor]" | Seller row still counts in aggregates |
| card_final_digits | NULL/Empty | "-" | May not be captured; graceful degradation |
| notes | NULL/Empty | "-" | Common; no impact on calculations |
| bank_info (D+) | NULL/Empty | "-" | User may not have filled it |
| table_info (D+) | NULL/Empty | "-" | Metadata; optional |
| card_final_digits | "" | Skip column or show "-" | **CHECK DB SCHEMA** for current state |

---

## Subtotals & Totals

### Credit Card Detail Table

After each terminal group:
```
LARANJINHA H
  [row 1]
  [row 2]
  Subtotal LARANJINHA H | | | 800,00 | 880,00 | 80,00 | |
```

Grand total (after all groups):
```
TOTAL | | | 1.000,00 | 1.100,00 | 100,00 | |
```

**Subtotal Row Styling**: Bold, gray background, no seller/notes  
**Grand Total Row Styling**: Bold, darker background, all numeric columns

### D+ Detail Table

Subtotal per seller (if grouped):
```
João Silva
  [row 1]
  [row 2]
  Subtotal João | | 10.000,00 | |
```

Grand total:
```
TOTAL | | 18.000,00 | |
```

### Summary Tables

Always include grand total row at bottom:
```
[Terminal Breakdown]
LARANJINHA H | 2 | 800,00 | 880,00 | 80,00
SUMUP R | 1 | 200,00 | 220,00 | 20,00
TOTAL | 3 | 1.000,00 | 1.100,00 | 100,00
```

---

## CSV Export Format

**Filename**: `relatorio_vendas_[branch_id]_[dateFrom]_[dateTo].csv`

**Example**:
```
relatorio_vendas_loja_central_2026-04-11_2026-04-11.csv
```

**Header Section** (comments):
```csv
# Relatório de Vendas
# Período: 11 de abril de 2026 até 11 de abril de 2026
# Unidade: Loja Central
# Data de Geração: 11/04/2026 15:35
#
# Resumo de KPIs
# Total de Vendas,R$ 12.500,00
# Valor Maquineta,R$ 12.800,00
# Total de Taxas,R$ 300,00
# Transações,5
```

**Credit Card Section**:
```csv
# Crédito
Terminal,Bandeira,Final Cartão,Parcela,Valor Venda,Valor Maquineta,Taxa,Vendedor,Obs
LARANJINHA H,MASTER,1234,1,500.00,550.00,50.00,João Silva,
LARANJINHA H,VISA,5678,1,300.00,330.00,30.00,João Silva,
```

**D+ Section**:
```csv
# D+ Produtos
Proposta,Banco,Tabela,Valor Contrato,Comissão,Vendedor,Obs
PRO-001,Itaú,TAB-001,5000.00,500.00,João Silva,Incluso documentação
PRO-002,Caixa,TAB-002,3000.00,300.00,Maria Santos,
```

**Summary Sections**:
```csv
# Resumo por Terminal
Terminal,Qtd,Valor Venda,Valor Maquineta,Taxa Total
LARANJINHA H,2,800.00,880.00,80.00
SUMUP R,1,200.00,220.00,20.00

# Resumo por Bandeira
Bandeira,Qtd,Valor Venda,Valor Maquineta,Taxa Total
MASTER,2,700.00,770.00,70.00
VISA,1,300.00,330.00,30.00

# Resumo por Vendedor
Vendedor,Qtd CC,Valor CC,Qtd D+,Valor D+,Total Geral
João Silva,2,800.00,1,5000.00,5800.00
Maria Santos,1,200.00,1,3000.00,3200.00
```

**Notes**:
- Use BOM (UTF-8 with BOM) for Excel compatibility
- Commas in values: Use quotes: `"São Paulo, Brasil"`
- Empty cells: Leave blank (no placeholder text)
- Decimal separator: Use `.` (dot) in CSV, not `,` (comma)

---

## Error Cases & Graceful Degradation

| Scenario | Handling |
|----------|----------|
| No sales in date range | Show "Nenhuma venda encontrada" in tables; KPIs = 0 |
| Seller has no CC sales | Show 0 in Qtd CC / Valor CC columns |
| Seller has no D+ sales | Show 0 in Qtd D+ / Valor D+ columns |
| Missing seller.name | Display seller_id or "[Sem Vendedor]" |
| Missing card_final_digits | Display "-" |
| Query fails | Show error toast + empty state; don't crash page |
| Branch_id is null | Don't execute query; show error |
| Invalid date range | Show validation error; don't fetch |

---

**Last Reviewed**: 2026-04-11  
**Next Review**: After first sprint implementation
