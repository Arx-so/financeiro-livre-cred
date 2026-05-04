import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import { getFavorecido, getFavorecidoDocuments } from '@/services/cadastros';
import { getFinancialEntries } from '@/services/financeiro';
import { getContracts } from '@/services/contratos';
import { getCreditCardSales } from '@/services/salesCreditCard';
import { getDPlusSales } from '@/services/salesDPlus';
import { getPayrolls } from '@/services/folhaPagamento';
import { getEmployeeVacations } from '@/services/hrFerias';
import { getOccupationalExams } from '@/services/hrExames';
import { getEntityLogs } from '@/services/activityLogs';

export function useFavorecidoDetail(id: string) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const favorecido = useQuery({
        queryKey: ['favorecido-detail', id],
        queryFn: () => getFavorecido(id),
        enabled: !!id,
    });

    const financialEntries = useQuery({
        queryKey: ['favorecido-financeiro', id, branchId],
        queryFn: () => getFinancialEntries({ favorecidoId: id, branchId }),
        enabled: !!id,
    });

    const contracts = useQuery({
        queryKey: ['favorecido-contracts', id, branchId],
        queryFn: () => getContracts({ favorecidoId: id, branchId }),
        enabled: !!id,
    });

    const creditCardSales = useQuery({
        queryKey: ['favorecido-cc-sales', id, branchId],
        queryFn: async () => {
            const [asClient, asSeller] = await Promise.all([
                getCreditCardSales({ clientId: id, branchId }),
                getCreditCardSales({ sellerId: id, branchId }),
            ]);
            const merged = [...asClient];
            asSeller.forEach((s) => {
                if (!merged.find((m) => m.id === s.id)) merged.push(s);
            });
            return merged;
        },
        enabled: !!id,
    });

    const dplusSales = useQuery({
        queryKey: ['favorecido-dplus-sales', id, branchId],
        queryFn: async () => {
            const [asClient, asSeller] = await Promise.all([
                getDPlusSales({ clientId: id, branchId }),
                getDPlusSales({ sellerId: id, branchId }),
            ]);
            const merged = [...asClient];
            asSeller.forEach((s) => {
                if (!merged.find((m) => m.id === s.id)) merged.push(s);
            });
            return merged;
        },
        enabled: !!id,
    });

    const payrolls = useQuery({
        queryKey: ['favorecido-payrolls', id, branchId],
        queryFn: () => getPayrolls({ employeeId: id, branchId }),
        enabled: !!id && (favorecido.data?.type === 'funcionario' || favorecido.data?.type === 'ambos'),
    });

    const vacations = useQuery({
        queryKey: ['favorecido-vacations', id, branchId],
        queryFn: () => getEmployeeVacations({ employeeId: id, branchId }),
        enabled: !!id && (favorecido.data?.type === 'funcionario' || favorecido.data?.type === 'ambos'),
    });

    const exams = useQuery({
        queryKey: ['favorecido-exams', id, branchId],
        queryFn: () => getOccupationalExams({ employeeId: id, branchId }),
        enabled: !!id && (favorecido.data?.type === 'funcionario' || favorecido.data?.type === 'ambos'),
    });

    const documents = useQuery({
        queryKey: ['favorecido-documents-detail', id],
        queryFn: () => getFavorecidoDocuments(id),
        enabled: !!id,
    });

    const logs = useQuery({
        queryKey: ['favorecido-logs', id],
        queryFn: () => getEntityLogs('favorecido', id),
        enabled: !!id,
    });

    const entries = financialEntries.data ?? [];
    const totalReceita = entries.filter((e) => e.type === 'receita').reduce((s, e) => s + e.value, 0);
    const totalDespesa = entries.filter((e) => e.type === 'despesa').reduce((s, e) => s + e.value, 0);
    const totalPendente = entries.filter((e) => e.status === 'pendente').reduce((s, e) => s + e.value, 0);
    const contratosAtivos = (contracts.data ?? []).filter((c) => c.status === 'ativo').length;
    const totalVendasCC = (creditCardSales.data ?? []).reduce((s, v) => s + (v.terminal_amount ?? 0), 0);
    const totalVendasDP = (dplusSales.data ?? []).reduce((s, v) => s + (v.contract_value ?? 0), 0);
    const ultimoSalario = (payrolls.data ?? [])[0]?.net_salary ?? null;

    return {
        favorecido,
        financialEntries,
        contracts,
        creditCardSales,
        dplusSales,
        payrolls,
        vacations,
        exams,
        documents,
        logs,
        kpis: {
            totalReceita,
            totalDespesa,
            totalPendente,
            contratosAtivos,
            totalVendasCC,
            totalVendasDP,
            ultimoSalario,
        },
    };
}
