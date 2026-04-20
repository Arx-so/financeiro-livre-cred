# Audit Developer Reference
**For developers implementing the gap fixes identified in Request 1 audit**

---

## Quick Navigation

**Audit Documents:**
- Main Report: `/AUDIT_REQUEST_1_IMPLEMENTATION.md` (3,000+ lines, detailed)
- Gap Summary: `/AUDIT_GAP_SUMMARY.md` (quick reference, feature matrix)
- This File: Developer file paths and specific code locations

---

## Critical Implementation: Aniversários (Birthdays)

### Database Changes Required
```
File: supabase/migrations/[next_number]_add_birthdays.sql

Steps:
1. Add column to favorecidos:
   ALTER TABLE favorecidos ADD COLUMN data_nascimento DATE;

2. Create employee_birthdays table (optional, if tracking separately):
   CREATE TABLE employee_birthdays (
       id UUID PRIMARY KEY,
       branch_id UUID NOT NULL REFERENCES branches(id),
       employee_id UUID NOT NULL REFERENCES favorecidos(id),
       birth_date DATE NOT NULL,
       created_at TIMESTAMPTZ,
       updated_at TIMESTAMPTZ
   );

3. Add RLS policies (copy pattern from hr_alerts table)

Reference implementation:
  - See: supabase/migrations/035_hr_module.sql (RLS policy pattern)
```

### Application Code (React)

```
NEW FILES TO CREATE:

1. src/services/hrAniversarios.ts
   • Function: fetchAniversarios(branchId, month?, year?)
   • Returns: array of {employee_id, name, birth_date, days_until_birthday}
   • Function: fetchUpcomingBirthdays(branchId, daysAhead = 30)
   • Function: createBirthdayReminder(employeeId, remindDays)

2. src/hooks/useAniversarios.ts
   • useAniversarios(month, year) — hook wrapper for service
   • useCreateBirthdayReminder() — mutation hook
   • useDeleteBirthdayReminder() — mutation hook

3. src/pages/RH/Aniversarios.tsx
   • List view with month/year filtering
   • Search by employee name
   • Add/edit birth date modal
   • Table: Employee, Birth Date, Days Until Birthday, Actions
   • Mirror UI pattern from: src/pages/RH/Ferias.tsx

Reference implementations:
  - Férias CRUD: src/pages/RH/Ferias.tsx (100-300 lines)
  - Service pattern: src/services/hrFerias.ts (80-100 lines)
  - Hook pattern: src/hooks/useFerias.ts (50-80 lines)
  - Type definitions: src/types/database.ts (add EmployeeBirthdayRow types)
```

### Alert Integration

```
File: src/services/hrAlerts.ts

Existing structure:
  • Function: generateHrAlerts() — main generation function
  • Handles: ferias_expiring, exames_expiring, atestado_alert, certificado_alert, aniversario
  
Add birthday alert generation:
  1. Query all employees with data_nascimento
  2. Calculate days until next birthday
  3. Create alerts for:
     - 30 days before (alert_type: 'aniversario', priority: 3)
     - ON birthday (alert_type: 'aniversario', priority: 2)
     - OPTIONAL: 3 days before (alert_type: 'aniversario_reminder', priority: 4)
  
Pattern to follow:
  • See: generateExamAlerts() function (lines 50-80)
```

### Dashboard Integration

```
File: src/pages/RH/index.tsx (RhDashboard component)

Current state:
  • Line 119: <StatCard label="Aniversários do Mês" value={summary?.birthdaysThisMonth ?? 0} />
  • summary.birthdaysThisMonth currently returns 0 (data missing)

Change required:
  • Verify useHrDashboardSummary() hook fetches birthday count
  • See: src/hooks/useHrAlerts.ts → useHrDashboardSummary()
  • Add query: COUNT(*) FROM employee_birthdays WHERE MONTH(birth_date) = MONTH(NOW())
```

---

## Important: Sales Report Summary

### Database Already Ready
No schema changes needed. Data exists in:
- `sales_credit_card` table — all fields present
- `sales_d_plus_products` table — all fields present

### Service Enhancement

```
File: src/services/salesCreditCard.ts

Add aggregation function:
  function getSalesReportSummary(branchId, startDate, endDate) {
    return {
      totalSalesValue: SUM(sale_value),
      totalTerminalAmount: SUM(terminal_amount),
      totalFeeAmount: SUM(terminal_amount - sale_value),
      byTerminal: {
        sumup_w: {...},
        sumup_r: {...},
        sumup_h: {...},
        // ... etc for each terminal type
      },
      byCardBrand: {
        visa: {...},
        master: {...},
        // ... etc
      },
      byStatus: {
        pendente: count,
        pago: count,
        cancelado: count,
      }
    }
  }

Reference:
  • Similar pattern may exist in src/services/salesCreditCard.ts (check for existing aggregations)
```

### UI Component

```
File: src/pages/Vendas/index.tsx (Sales dashboard)

Add after line ~150 (after tabs definition):
  • New section: "Resumo de Vendas" (sales summary section)
  • StatCard grid showing:
    - Total valor maquineta (sum)
    - Total taxa (fees)
    - Sales by terminal type (Sumup W, Sumup R, etc.) with % breakdown
    - Sales by card brand with % breakdown
  
Use components:
  - StatCard (src/components/shared/StatCard.tsx) — for totals
  - Custom bar chart (recharts) for terminal breakdown
  
Reference layout:
  • src/pages/Planejamento/index.tsx (similar summary card layout)
```

---

## Important: Vale Transporte Monthly Report

### Service Enhancement

```
File: src/services/hrValeTransporte.ts

Add:
  function getMonthlyVtReport(branchId, year, month) {
    return {
      totalAmount: SUM(recharge_amount),
      byEmployee: [...],
      byDepartment: [...],
      details: [
        {employee_name, count_recharges, total_amount, last_recharge}
      ]
    }
  }
  
  function exportVtReportPDF(report, filename) {
    // Use jsPDF library (already in project)
    // Generate table with totals
  }
```

### UI Component

```
File: src/pages/RH/ValeTransporte.tsx

Add report modal/tab:
  • Date range picker (month/year)
  • Branch filter (if applicable)
  • Report preview table with totals
  • Export PDF button
  
Reference:
  • Modal pattern: src/pages/Vendas/CreditCardSaleModal.tsx
  • PDF export: Check if project has jsPDF utility
```

---

## Important: HR Reports Consolidation Page

### New Page

```
File: src/pages/RH/Relatorios.tsx (NEW)

Structure:
  • Report type selector: Férias | Exames | Atestados | Vale Transporte
  • Date range filters (start, end)
  • Branch filter (if multi-branch)
  • Display mode: Table view | Download CSV | Download PDF
  • Preview table matching report type
  • Export buttons

Components needed:
  • Reuse query functions from existing modules
  • Combine ResultSet from Férias, Exames, Atestados, VT
  
Reference:
  • src/pages/RH/Ferias.tsx (has filter pattern)
  • src/pages/Vendas/index.tsx (has multi-tab export pattern)
```

### Routing

```
File: src/App.tsx

Add route:
  <Route path="/rh/relatorios" element={<ProtectedRoute><RhRelatorios /></ProtectedRoute>} />

Also update navigation:
  File: src/pages/RH/index.tsx
  Add link in quickLinks array (around line 77)
```

---

## Types Reference

### HR Types

```
File: src/types/database.ts

Current types (verify these match):
  • EmployeeVacationRow (employee_vacations table)
  • OccupationalExamRow (occupational_exams table)
  • VtRechargeRow (vt_recharges table)
  • CorporateHolidayRow (corporate_holidays table)
  • MedicalCertificateRow (medical_certificates table)
  • HrAlertRow (hr_alerts table)

Add for Aniversários:
  • EmployeeBirthdayRow (if separate table) OR
  • Update EmployeeRow to include data_nascimento
```

### Sales Types

```
File: src/types/database.ts

Current types (verify these match):
  • SalesCreditCardRow (sales_credit_card table)
  • SalesDPlusProductRow (sales_d_plus_products table)

New types for reports:
  • SalesReportSummary (aggregated data)
  • TerminalBreakdown (by-terminal totals)
  • CardBrandBreakdown (by-brand totals)
```

---

## Constants Reference

```
File: src/constants/hr.ts

Current constants:
  • VACATION_STATUSES
  • VACATION_STATUS_LABELS
  • ALERT_TYPE_LABELS
  • ALERT_PRIORITY

Verify for Aniversários:
  • May need BIRTHDAY_ALERT_TYPES if separate from general alerts
```

```
File: src/constants/sales.ts

Current constants:
  • TERMINALS, TERMINAL_LABELS
  • CARD_BRANDS, CARD_BRAND_LABELS
  • PAYMENT_METHODS, PAYMENT_METHOD_LABELS
  • TRANSFER_SOURCES, TRANSFER_SOURCE_LABELS

All needed for report breakdown
```

---

## Testing Checklist

### For Aniversários Implementation

```
Manual Testing:
[ ] Can add birth date to employee record
[ ] List shows employees with birthdays this month
[ ] Filter by month works
[ ] Search by name works
[ ] Alert generated 30 days before birthday
[ ] Alert generated on birthday
[ ] Dashboard shows correct count for month
[ ] CSV export includes birth dates
[ ] Edit existing birthday
[ ] Delete birthday record
```

### For Sales Report

```
Manual Testing:
[ ] Report shows correct totals (sum of amounts)
[ ] Terminal breakdown shows all 8 terminals
[ ] Percentages calculated correctly
[ ] Card brand breakdown shows all 5 brands
[ ] Status breakdown counts match actual records
[ ] Date range filter works
[ ] CSV export includes all fields
[ ] PDF export (if implemented) generates readable file
[ ] Report works with 0 sales
[ ] Report works with 1000+ sales
```

### For VT Monthly Report

```
Manual Testing:
[ ] Month/year picker works
[ ] Report shows all employees with VT that month
[ ] Totals calculated correctly
[ ] Branch filter (if applicable) works
[ ] PDF export generates readable file
[ ] Table is sortable by amount
[ ] Works with 0 recharges
[ ] Works with 100+ recharges
```

---

## Build & Deploy

```
After changes:

1. TypeScript check:
   npm run build

2. Lint:
   npm run lint

3. Test in dev:
   npm run dev
   Manually test each feature listed above

4. Git:
   Create feature branch per item:
   git checkout -b feat/aniversarios-module
   git checkout -b feat/sales-report-summary
   etc.

5. PR Review:
   Share against master
   Reference: AUDIT_GAP_SUMMARY.md for context
```

---

## Debugging

### Common Issues

**Aniversários data not showing in dashboard:**
- Check: Is data_nascimento being fetched from favorecidos?
- Check: Is useHrDashboardSummary() querying the right table?
- Check: Are birth dates in YYYY-MM-DD format?

**Sales report totals wrong:**
- Check: Query is filtering by correct branch_id
- Check: Status filter (include pending+paid or paid-only?)
- Check: Date range is inclusive/exclusive correctly

**Alerts not triggering:**
- Check: generateHrAlerts() is being called
- Check: Date calculation logic (today vs alert_date)
- Check: Branch_id is passed correctly

---

## Files Not Needing Changes

These files are already correct per audit:

- ✅ src/pages/RH/Ferias.tsx
- ✅ src/pages/RH/Exames.tsx
- ✅ src/pages/RH/Atestados.tsx
- ✅ src/pages/RH/Calendario.tsx
- ✅ src/pages/Vendas/index.tsx (CreditCard tab)
- ✅ src/pages/Vendas/DPlusSaleModal.tsx
- ✅ supabase/migrations/035_hr_module.sql
- ✅ supabase/migrations/036_sales_module.sql
- ✅ supabase/migrations/037_sales_financial_entries.sql

---

## Questions?

Refer to:
1. AUDIT_REQUEST_1_IMPLEMENTATION.md (detailed section per feature)
2. AUDIT_GAP_SUMMARY.md (quick lookup table)
3. Code references above for exact file locations
4. Existing similar implementations in codebase

---

**Generated:** 2026-04-11  
**For:** Development Team  
**Prepared by:** AI Product Owner/Analyst
