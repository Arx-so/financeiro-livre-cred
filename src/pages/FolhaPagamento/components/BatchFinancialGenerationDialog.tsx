import { useState, useEffect, useMemo } from 'react';
import {
    Zap, Search, ChevronRight, ChevronLeft, AlertTriangle,
    CheckCircle2, XCircle, Loader2, Users, Calendar,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { getPayrollsInRange } from '@/services/folhaPagamento';
import { useBranchStore } from '@/stores';
import { useBatchGenerateFinancialEntries, type BatchGenerationResultItem } from '@/hooks/useFolhaPagamento';
import type { PayrollWithEmployee } from '@/services/folhaPagamento';

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type Step = 'selection' | 'review' | 'result';

interface Employee {
    id: string;
    name: string;
    categoria_contratacao?: string | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    allEmployees: Employee[];
}

export function BatchFinancialGenerationDialog({ open, onClose, allEmployees }: Props) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const batchMutation = useBatchGenerateFinancialEntries();

    const currentDate = new Date();
    const [step, setStep] = useState<Step>('selection');

    // Step 1: selection
    const [employeeMode, setEmployeeMode] = useState<'all' | 'specific'>('all');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [startMonth, setStartMonth] = useState(currentDate.getMonth() + 1);
    const [startYear, setStartYear] = useState(currentDate.getFullYear());
    const [endMonth, setEndMonth] = useState(currentDate.getMonth() + 1);
    const [endYear, setEndYear] = useState(currentDate.getFullYear());

    // Step 2: review
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedPayrolls, setFetchedPayrolls] = useState<PayrollWithEmployee[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Step 3: result
    const [results, setResults] = useState<BatchGenerationResultItem[]>([]);

    const years = useMemo(
        () => Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - 3 + i),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const filteredEmployees = useMemo(
        () => allEmployees.filter((e) => e.name.toLowerCase().includes(employeeSearch.toLowerCase())),
        [allEmployees, employeeSearch],
    );

    const withoutEntry = useMemo(
        () => fetchedPayrolls.filter((p) => !p.financial_entry_id),
        [fetchedPayrolls],
    );
    const withEntry = useMemo(
        () => fetchedPayrolls.filter((p) => !!p.financial_entry_id),
        [fetchedPayrolls],
    );

    useEffect(() => {
        if (!open) {
            setStep('selection');
            setEmployeeMode('all');
            setSelectedEmployeeIds([]);
            setEmployeeSearch('');
            setStartMonth(new Date().getMonth() + 1);
            setStartYear(new Date().getFullYear());
            setEndMonth(new Date().getMonth() + 1);
            setEndYear(new Date().getFullYear());
            setFetchedPayrolls([]);
            setSelectedIds([]);
            setResults([]);
        }
    }, [open]);

    const toggleEmployee = (id: string) => {
        setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
    };

    const togglePayroll = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleFetchPayrolls = async () => {
        setIsFetching(true);
        try {
            const branchId = unidadeAtual?.code === 'ADM' ? undefined : unidadeAtual?.id;
            const empIds = employeeMode === 'specific' ? selectedEmployeeIds : undefined;
            const data = await getPayrollsInRange(branchId, empIds, startYear, startMonth, endYear, endMonth);
            setFetchedPayrolls(data);
            setSelectedIds(data.filter((p) => !p.financial_entry_id).map((p) => p.id));
            setStep('review');
        } catch {
            // handled upstream
        } finally {
            setIsFetching(false);
        }
    };

    const handleGenerate = async () => {
        const payrollsToProcess = fetchedPayrolls.filter((p) => selectedIds.includes(p.id));
        const res = await batchMutation.mutateAsync(payrollsToProcess);
        setResults(res);
        setStep('result');
    };

    const createdCount = results.filter((r) => r.status === 'created').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    const isRangeValid = useMemo(() => {
        const startIndex = startYear * 12 + startMonth;
        const endIndex = endYear * 12 + endMonth;
        return endIndex >= startIndex;
    }, [startMonth, startYear, endMonth, endYear]);

    const canFetch = isRangeValid && (employeeMode === 'all' || selectedEmployeeIds.length > 0);

    const stepLabel = (s: Step) => {
        if (s === 'selection') return 'Seleção';
        if (s === 'review') return 'Revisão';
        return 'Resultado';
    };

    const toggleGroupSelection = (group: PayrollWithEmployee[]) => {
        const groupIds = group.map((p) => p.id);
        const allSelected = groupIds.every((id) => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...groupIds])]);
        }
    };

    const selectedTotal = fetchedPayrolls
        .filter((p) => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + p.net_salary, 0);

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Gerar Lançamentos Financeiros em Lote
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'selection' && 'Selecione os funcionários e o período das folhas.'}
                        {step === 'review' && (
                            <>
                                {fetchedPayrolls.length}
                                {' '}
                                folha(s) encontrada(s). Revise antes de confirmar.
                            </>
                        )}
                        {step === 'result' && 'Processamento concluído.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Step indicators */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {(['selection', 'review', 'result'] as Step[]).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            {i > 0 && <ChevronRight className="w-3 h-3" />}
                            <span className={step === s ? 'text-primary font-semibold' : ''}>
                                {i + 1}
                                {'. '}
                                {stepLabel(s)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ─── STEP 1: SELECTION ─── */}
                {step === 'selection' && (
                    <div className="space-y-5 mt-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Funcionários</label>
                            <div className="flex gap-3">
                                <label
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors flex-1 ${
                                        employeeMode === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        checked={employeeMode === 'all'}
                                        onChange={() => setEmployeeMode('all')}
                                    />
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Todos os funcionários</p>
                                        <p className="text-xs text-muted-foreground">
                                            {allEmployees.length}
                                            {' funcionário(s)'}
                                        </p>
                                    </div>
                                </label>
                                <label
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors flex-1 ${
                                        employeeMode === 'specific' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        checked={employeeMode === 'specific'}
                                        onChange={() => setEmployeeMode('specific')}
                                    />
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Selecionar específicos</p>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedEmployeeIds.length > 0
                                                ? `${selectedEmployeeIds.length} selecionado(s)`
                                                : 'Nenhum selecionado'}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {employeeMode === 'specific' && (
                                <div className="mt-3 border border-border rounded-lg overflow-hidden">
                                    <div className="p-2 border-b border-border bg-muted/30">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                className="input-financial pl-9 py-1.5 text-sm"
                                                placeholder="Buscar funcionário..."
                                                value={employeeSearch}
                                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredEmployees.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Nenhum funcionário encontrado
                                            </p>
                                        ) : (
                                            filteredEmployees.map((emp) => (
                                                <label
                                                    key={emp.id}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-input"
                                                        checked={selectedEmployeeIds.includes(emp.id)}
                                                        onChange={() => toggleEmployee(emp.id)}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{emp.name}</p>
                                                        {emp.categoria_contratacao && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {emp.categoria_contratacao}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    {selectedEmployeeIds.length > 0 && (
                                        <div className="px-4 py-2 bg-primary/5 border-t border-border">
                                            <button
                                                type="button"
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                                onClick={() => setSelectedEmployeeIds([])}
                                            >
                                                Limpar seleção
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date range */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                <Calendar className="inline w-4 h-4 mr-1 mb-0.5" />
                                Período
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1.5">De</p>
                                    <div className="flex gap-2">
                                        <select
                                            className="input-financial flex-1"
                                            value={startMonth}
                                            onChange={(e) => setStartMonth(parseInt(e.target.value, 10))}
                                        >
                                            {monthNames.map((name, i) => (
                                                <option key={i} value={i + 1}>{name}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="input-financial w-24"
                                            value={startYear}
                                            onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
                                        >
                                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1.5">Até</p>
                                    <div className="flex gap-2">
                                        <select
                                            className="input-financial flex-1"
                                            value={endMonth}
                                            onChange={(e) => setEndMonth(parseInt(e.target.value, 10))}
                                        >
                                            {monthNames.map((name, i) => (
                                                <option key={i} value={i + 1}>{name}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="input-financial w-24"
                                            value={endYear}
                                            onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                                        >
                                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {!isRangeValid && (
                                <p className="text-xs text-destructive mt-1.5">
                                    A data final deve ser igual ou posterior à data inicial.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleFetchPayrolls}
                                disabled={!canFetch || isFetching}
                            >
                                {isFetching
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <ChevronRight className="w-4 h-4" />}
                                Buscar Folhas
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: REVIEW ─── */}
                {step === 'review' && (
                    <div className="space-y-4 mt-3">
                        {fetchedPayrolls.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p className="font-medium">Nenhuma folha encontrada</p>
                                <p className="text-sm mt-1">Ajuste os filtros e tente novamente.</p>
                            </div>
                        ) : (
                            <>
                                {withoutEntry.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-income" />
                                                Sem lançamento financeiro
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    (
                                                    {withoutEntry.filter((p) => selectedIds.includes(p.id)).length}
                                                    /
                                                    {withoutEntry.length}
                                                    {' selecionadas)'}
                                                </span>
                                            </h4>
                                            <button
                                                type="button"
                                                className="text-xs text-primary hover:underline"
                                                onClick={() => toggleGroupSelection(withoutEntry)}
                                            >
                                                {withoutEntry.every((p) => selectedIds.includes(p.id))
                                                    ? 'Desmarcar todos'
                                                    : 'Selecionar todos'}
                                            </button>
                                        </div>
                                        <div className="border border-border rounded-lg overflow-hidden">
                                            {withoutEntry.map((p) => (
                                                <PayrollReviewRow
                                                    key={p.id}
                                                    payroll={p}
                                                    selected={selectedIds.includes(p.id)}
                                                    onToggle={() => togglePayroll(p.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {withEntry.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-warning" />
                                                Já possuem lançamento financeiro
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    (
                                                    {withEntry.filter((p) => selectedIds.includes(p.id)).length}
                                                    /
                                                    {withEntry.length}
                                                    {' selecionadas)'}
                                                </span>
                                            </h4>
                                            <button
                                                type="button"
                                                className="text-xs text-primary hover:underline"
                                                onClick={() => toggleGroupSelection(withEntry)}
                                            >
                                                {withEntry.every((p) => selectedIds.includes(p.id))
                                                    ? 'Desmarcar todos'
                                                    : 'Selecionar todos'}
                                            </button>
                                        </div>
                                        <div className="p-3 mb-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-foreground">
                                            <strong>Atenção:</strong>
                                            {' '}
                                            Se incluídas, o lançamento existente será
                                            {' '}
                                            <strong>substituído</strong>
                                            {' '}
                                            por um novo. Esta ação não pode ser desfeita.
                                        </div>
                                        <div className="border border-warning/40 rounded-lg overflow-hidden">
                                            {withEntry.map((p) => (
                                                <PayrollReviewRow
                                                    key={p.id}
                                                    payroll={p}
                                                    selected={selectedIds.includes(p.id)}
                                                    onToggle={() => togglePayroll(p.id)}
                                                    hasExisting
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {selectedIds.length}
                                        {' folha(s) selecionada(s) para geração'}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(selectedTotal)}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between gap-3 pt-2">
                            <button
                                type="button"
                                className="btn-secondary flex items-center gap-2"
                                onClick={() => setStep('selection')}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Voltar
                            </button>
                            <div className="flex gap-3">
                                <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleGenerate}
                                    disabled={selectedIds.length === 0 || batchMutation.isPending}
                                >
                                    {batchMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Zap className="w-4 h-4" />
                                    Gerar
                                    {' '}
                                    {selectedIds.length}
                                    {' lançamento(s)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: RESULT ─── */}
                {step === 'result' && (
                    <div className="space-y-4 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-income/10 border border-income/20 rounded-lg text-center">
                                <CheckCircle2 className="w-6 h-6 text-income mx-auto mb-1" />
                                <p className="text-2xl font-bold text-income">{createdCount}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Lançamento(s) criado(s)</p>
                            </div>
                            <div
                                className={`p-4 rounded-lg text-center border ${
                                    errorCount > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50 border-border'
                                }`}
                            >
                                {errorCount > 0
                                    ? <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
                                    : <CheckCircle2 className="w-6 h-6 text-muted-foreground mx-auto mb-1" />}
                                <p className={`text-2xl font-bold ${errorCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {errorCount}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">Erro(s)</p>
                            </div>
                        </div>

                        <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                            {results.map((r) => (
                                <div
                                    key={r.payrollId}
                                    className={`flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 text-sm ${
                                        r.status === 'error' ? 'bg-destructive/5' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {r.status === 'created'
                                            ? <CheckCircle2 className="w-4 h-4 text-income flex-shrink-0" />
                                            : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                                        <div>
                                            <p className="font-medium text-foreground">{r.employeeName}</p>
                                            <p className="text-xs text-muted-foreground">{r.period}</p>
                                            {r.error && (
                                                <p className="text-xs text-destructive">{r.error}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm text-foreground">{formatCurrency(r.value)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="button" className="btn-primary" onClick={onClose}>Fechar</button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface PayrollReviewRowProps {
    payroll: PayrollWithEmployee;
    selected: boolean;
    onToggle: () => void;
    hasExisting?: boolean;
}

function PayrollReviewRow({
    payroll, selected, onToggle, hasExisting = false,
}: PayrollReviewRowProps) {
    return (
        <label className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer border-b border-border last:border-0 transition-colors">
            <input
                type="checkbox"
                className="w-4 h-4 rounded border-input flex-shrink-0"
                checked={selected}
                onChange={onToggle}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {payroll.employee?.name || 'Funcionário'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {monthNames[payroll.reference_month - 1]}
                    /
                    {payroll.reference_year}
                    {payroll.employee?.categoria_contratacao && (
                        <>
                            {' · '}
                            {payroll.employee.categoria_contratacao}
                        </>
                    )}
                </p>
            </div>
            {hasExisting && selected && (
                <span className="text-xs px-1.5 py-0.5 bg-warning/20 text-warning rounded whitespace-nowrap">
                    Substituirá existente
                </span>
            )}
            <span className="font-mono text-sm font-semibold text-foreground flex-shrink-0">
                {formatCurrency(payroll.net_salary)}
            </span>
        </label>
    );
}
