# Sales Report Specification — Documentation Index

**Generated**: 2026-04-11  
**Client Request**: Build daily sales report page (`/vendas/relatorio`)  
**Status**: Ready for Development

---

## Quick Navigation

### Start Here (5 minutes)
→ **[SALES_REPORT_QUICK_REFERENCE.md](./SALES_REPORT_QUICK_REFERENCE.md)**
- One-page overview of all features
- Effort estimate: ~50 hours
- Table layouts with sample data
- Component structure diagram

### Main Specification (30 minutes)
→ **[TECHNICAL_SPEC_SALES_REPORT.md](./TECHNICAL_SPEC_SALES_REPORT.md)**
- 14 comprehensive sections
- 15 functional requirements (FR-001 to FR-015)
- 7 business rules (BR-001 to BR-007)
- 10 acceptance criteria
- 5 open questions for client
- Development checklist

### Developer Reference (During Implementation)
→ **[SALES_REPORT_FIELD_MAPPINGS.md](./SALES_REPORT_FIELD_MAPPINGS.md)**
- Exact database field to column mappings
- SQL query templates
- Filter logic implementation details
- Currency formatting rules
- CSV export format specification
- Error handling scenarios

### Agent Memory Files
→ **[.claude/agent-memory/product-owner-analyst/MEMORY.md](./.claude/agent-memory/product-owner-analyst/MEMORY.md)**
- Index of all project knowledge
- References to architecture, requirements, domain knowledge

→ **[.claude/agent-memory/product-owner-analyst/sales-report-structure.md](./.claude/agent-memory/product-owner-analyst/sales-report-structure.md)**
- Sales report layout details from client Excel template
- KPI sections and grouping logic

---

## Document Purposes

| Document | Audience | Length | Purpose |
|----------|----------|--------|---------|
| QUICK_REFERENCE | Managers, Leads | 5 min | Get oriented, understand scope + effort |
| TECHNICAL_SPEC | Developers, QA | 30 min | Full requirements, acceptance criteria, open questions |
| FIELD_MAPPINGS | Developers | 20 min | Implementation details, exact field names, query templates |
| MEMORY.md | Claude AI | N/A | Knowledge base for future conversations |
| sales-report-structure.md | Claude AI | N/A | Client document structure reference |

---

## How to Use These Documents

### For the First Time Reading

1. **Read**: SALES_REPORT_QUICK_REFERENCE.md (5 min)
2. **Skim**: Section 3 (Functional Requirements) in TECHNICAL_SPEC_SALES_REPORT.md (10 min)
3. **Bookmark**: SALES_REPORT_FIELD_MAPPINGS.md for later reference

### During Development

1. **Implement**: Service function using signatures in QUICK_REFERENCE
2. **Check Details**: Reference FIELD_MAPPINGS for exact column names
3. **Verify Requirements**: Cross-check TECHNICAL_SPEC FR-* items
4. **Test**: Use acceptance criteria (AC-001 to AC-010) in TECHNICAL_SPEC

### Before Final Review

1. **Verify**: All 15 functional requirements (FR-001 to FR-015) implemented
2. **Test**: All 10 acceptance criteria (AC-001 to AC-010) passing
3. **Check**: Branch isolation (BR-003) working correctly
4. **Confirm**: Currency formatting (R$ 1.234,56) correct

---

## Key Takeaways

### What We're Building
A daily sales report page showing:
- 4 KPI summary cards (totals, counts)
- 5 tabbed views (CC detail, D+ detail, terminal summary, brand summary, seller summary)
- Filters (date range, terminal, seller)
- CSV export capability

### Data Sources
- `sales_credit_card` table (credit card transactions)
- `sales_d_plus_products` table (D+ commissions)
- `favorecidos` table (seller/client names via joins)

### Effort
~50 hours for MVP (critical + important features)

### Critical Rule
**ALL queries must include `branch_id` filter** — this is a multi-tenant system scoped by branch.

---

## Open Questions (Client Decision Required)

Before starting development, get client to clarify:

1. **KPI Card Scope**: Should "Total de Vendas" include only credit card sales or also D+ contract values?
2. **Historical Data**: Should report support past months or just current day?
3. **Reconciliation**: Is cash reconciliation section (Início Espécie, Transferências, etc.) required for MVP?
4. **CSV Contents**: Should export include all data (detail + summaries) or just detail rows?
5. **Format**: Do you need PDF export or is CSV sufficient?

---

## File Structure (What to Create)

```
src/
├── services/
│   └── salesReport.ts (new)              Main service function
├── hooks/
│   └── useSalesReport.ts (new)           React Query hook
├── pages/
│   └── Vendas/
│       └── RelatorioVendas.tsx (new)     Main page component
└── components/
    └── sales-report/ (new folder)
        ├── SalesReportFilters.tsx
        ├── KPICards.tsx
        ├── ReportTabs.tsx
        ├── CreditCardTable.tsx
        ├── DPlusTable.tsx
        ├── TerminalBreakdownTable.tsx
        ├── BrandBreakdownTable.tsx
        └── SellerBreakdownTable.tsx

Also modify:
  src/App.tsx — Add route for /vendas/relatorio
```

---

## Routes & Navigation

**New Route**: `/vendas/relatorio`  
**Parent Menu**: Vendas (Sales module)  
**Link Label**: "Relatório de Vendas"  
**Access Control**: Coordenador, Gerente, Financeiro, Vendedor, Assistente

---

## Testing Checklist (Before Merge)

- [ ] Date filter works (recalculates totals)
- [ ] Terminal filter reduces data correctly
- [ ] Seller filter works across CC + D+
- [ ] Branch isolation: no cross-branch data visible
- [ ] KPI cards show correct calculations
- [ ] Credit card table groups by terminal → brand
- [ ] D+ table shows correct columns
- [ ] Terminal summary aggregates correctly
- [ ] Brand summary aggregates correctly
- [ ] Seller summary combines CC + D+
- [ ] Subtotals appear and match row sums
- [ ] Grand totals match subtotal sums
- [ ] CSV export is valid format
- [ ] CSV includes all required columns
- [ ] Empty state shown when no sales
- [ ] Currency formatted as R$ 1.234,56
- [ ] Responsive on mobile (320px), tablet (768px), desktop (1920px)
- [ ] Loading spinner appears during fetch
- [ ] Error message shown if query fails
- [ ] Null sellers handled gracefully

---

## Related Documents in Project

Other specifications related to sales module:
- `REQUEST_1_DELIVERY_SUMMARY.md` — Overall Request 1 scope (HR + Sales)
- `TECHNICAL_SPEC_REQUEST_1.md` — Request 1 full specification
- `src/constants/sales.ts` — Terminal, brand, payment method enums
- `src/services/salesCreditCard.ts` — Existing CC sales service
- `src/services/salesDPlus.ts` — Existing D+ sales service

---

## Questions or Clarifications?

Refer to the appropriate section:

| Question | Document | Section |
|----------|----------|---------|
| What's the overall scope? | QUICK_REFERENCE | Overview |
| What are the requirements? | TECHNICAL_SPEC | Section 3 (FR-001 to FR-015) |
| What fields do I query? | FIELD_MAPPINGS | Column mappings tables |
| What's the data model? | TECHNICAL_SPEC | Section 5 |
| How do I know when I'm done? | TECHNICAL_SPEC | Section 8 (AC-001 to AC-010) |
| What business rules apply? | TECHNICAL_SPEC | Section 4 (BR-001 to BR-007) |
| How do I handle errors? | FIELD_MAPPINGS | Null/Empty handling section |
| What about branch scoping? | FIELD_MAPPINGS | Branch filtering section |
| What's the CSV format? | FIELD_MAPPINGS | CSV export format section |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-11 | Claude (PO/BA) | Initial specification from client documents |

---

## Client Document Sources

Analysis based on:
- `RELATÓRIO DE VENDAS 2026.xlsx` — Excel template showing report layout
- `Detalhamento relatório vendas 2026.docx` — Requirements document
- WhatsApp screenshots — UI mockups and client expectations

---

**Ready to start development?** → Begin with [SALES_REPORT_QUICK_REFERENCE.md](./SALES_REPORT_QUICK_REFERENCE.md)

**Need detailed requirements?** → Review [TECHNICAL_SPEC_SALES_REPORT.md](./TECHNICAL_SPEC_SALES_REPORT.md)

**Implementing now?** → Keep [SALES_REPORT_FIELD_MAPPINGS.md](./SALES_REPORT_FIELD_MAPPINGS.md) open for reference

---

*This specification was generated by Claude Code using the Product Owner/Business Analyst role with expertise in financial management systems and Brazilian business context.*
