---
name: Sales Report Structure
description: Daily sales report layout extracted from client spreadsheet, includes KPIs, grouping logic, and client expectations
type: reference
---

## Sales Report Structure (from RELATÓRIO DE VENDAS 2026.xlsx)

### Top-level Report Sections

1. **Maquinetas Utilizadas** (Terminals Used)
   - List of terminals used that day (e.g., SUMUP R, LARANJINHA H, C6 R, etc.)

2. **Total Empréstimos** (Total Loans/Borrowed)
   - Single total value for loans managed

3. **Detalhamento das Maquinetas** (Terminal Breakdown)
   - Row headers: VALOR (Sale Value), BANDEIRA (Card Brand), FINAL CARTÃO (Card Last 4 Digits), OBS (Notes)
   - Each terminal gets rows for each card brand used
   - Shows: sale_value, card_brand, card_final_digits, parcela (installments), observações

4. **Saídas** (Outflows/Withdrawals)
   - Row items with descriptions and amounts
   - Categories: DESCRIÇÃO, VALOR
   - Examples: cash withdrawals, petty cash, etc.

5. **Descontos** (Discounts)
   - Separate section for discounts applied (may be part of Saídas or separate)

6. **Total de Saídas** (Total Outflows)
   - Sum of all saídas and descontos (note in Excel: "OBS: SOMA DAS SAÍDAS E DESCONTOS NÃO CONTABILIZADOS")

7. **Valor Final** (Final Value)
   - Total after all deductions

8. **Cash Control Section** (Espécie = Cash/Money)
   - INÍCIO ESPÉCIE (Opening cash balance)
   - ENTRADA ESPÉCIE (Cash input from sales)
   - TRASFERÊNCIA CENTRAL (Transfer from Central)
   - TRASFERÊNCIA RENATA (Transfer from Renata)
   - TRASFERÊNCIA RALF (Transfer from Ralf)
   - ENTRADA CLIENTES (Client payments in cash)
   - ENTRADA UNIDADES (Unit/Branch transfers)

9. **Daily Summary by Seller & Terminal**
   - Cross-tabulation of sellers x terminals
   - Shows transaction count or values

10. **Close-of-day items**
    - LACRE (Seal/Lock)
    - VALOR DEVOLUÇÃO SÁBADO (Saturday return value)
    - DATE (manual date fill: DATA: ___/___/___)

### Key Calculations

- **Total Sale Value** = Sum of all card sales (VALOR CLIENTE)
- **Terminal Amount** (Maquineta Amount) = Sale Value + Fees applied
- **Fee** = Terminal Amount - Sale Value
- **Total Fee** = Sum of all fees
- **Total Outflows** = All withdrawal items + discounts (note: NOT counted in official total in some cases)
- **Final Balance** = (Opening + Inflows) - (Outflows + Fees)

### Grouping & Aggregation

1. By Terminal (SUMUP W, SUMUP R, SUMUP H, LARANJINHA H, C6 R, PAGUE VELOZ, MERCADO PAGO R, PAGBANK H)
2. By Card Brand (MASTER, VISA, ELO, AMEX, HIPER)
3. By Seller (cross-tab with terminals)
4. By Payment Method (especie, pix, tec, pix_especie) — though not explicitly in Excel layout, client mentioned in requirements

### Export/Printing Considerations

- Formatted as a daily ledger (may be printed)
- Clear section headers with visual separation (colors in Excel: yellow, blue, green headers)
- Merged cells for section titles and totals
- Footer area with date, seal number, and return value

## Client Document References

- **Source**: RELATÓRIO DE VENDAS 2026.xlsx (Excel template)
- **Format**: Structured with specific row/column layout for manual or system-generated daily reports
- **Audience**: Daily operations team (sales, cashiers, managers) and accounting
- **Frequency**: Daily report (appears to be hand-filled or system-auto-filled)
- **Usage**: Close-of-day reconciliation, audit trail, cash management
