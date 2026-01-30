import {
    Receipt,
    Plus,
    Edit,
    Trash2,
    Loader2,
    User,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    Users,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    PageHeader,
    EmptyState,
    LoadingState,
    StatCard,
} from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import { BatchPayrollForm } from './components/BatchPayrollForm';
import { HiringCategoriesManager } from './components/HiringCategoriesManager';
import type { useFolhaPagamentoPage } from './useFolhaPagamentoPage';

type FolhaPagamentoViewProps = ReturnType<typeof useFolhaPagamentoPage>;

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function FolhaPagamentoView(props: FolhaPagamentoViewProps) {
    const {
        // Branch
        unidadeAtual,

        // State
        filterMonth,
        setFilterMonth,
        filterYear,
        setFilterYear,
        isModalOpen,
        setIsModalOpen,
        editingId,
        formData,
        setFormData,
        isDeleting,

        // Dialog
        dialogProps,

        // Data
        payrolls,
        payrollsLoading,
        summary,
        funcionarios,
        calculatedNetSalary,

        // Flags
        isSaving,
        isGeneratingEntry,

        // Handlers
        closeModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        handleGenerateEntry,
        resetForm,
        // Batch mode
        isBatchMode,
        setIsBatchMode,
        batchConfig,
        setBatchConfig,
        toggleBatchMode,
        handleBatchSubmit,
    } = props;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Folha de Pagamento"
                    description="Gerencie os pagamentos dos funcionários"
                >
                    <div className="flex items-center gap-2">
                        <HiringCategoriesManager />
                        <Dialog
                        open={isModalOpen}
                        onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Nova Folha
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingId ? 'Editar Folha' : isBatchMode ? 'Nova Folha em Lote' : 'Nova Folha de Pagamento'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingId
                                        ? 'Edite os dados da folha de pagamento'
                                        : isBatchMode
                                            ? 'Crie folhas de pagamento para múltiplos funcionários'
                                            : 'Preencha os dados da folha de pagamento'}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Branch Info in Form */}
                            {unidadeAtual && (
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Receipt className="w-4 h-4 text-primary" />
                                        <span className="font-medium">
                                            Filial:
                                            {' '}
                                            {unidadeAtual.name}
                                        </span>
                                        <span className="text-muted-foreground">
                                            (
                                            {unidadeAtual.code}
                                            )
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Toggle Batch Mode - Only show when creating new (not editing) */}
                            {!editingId && (
                                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isBatchMode}
                                            onChange={toggleBatchMode}
                                            className="w-4 h-4 rounded"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-foreground">
                                                Criar em lote (múltiplos funcionários)
                                            </span>
                                        </div>
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                                        {isBatchMode
                                            ? 'Crie folhas para vários funcionários de uma vez, com opção de recorrência'
                                            : 'Crie uma folha individual para um funcionário'}
                                    </p>
                                </div>
                            )}

                            {isBatchMode && !editingId ? (
                                <BatchPayrollForm
                                    branchId={unidadeAtual?.id || ''}
                                    formData={formData}
                                    setFormData={setFormData}
                                    batchConfig={batchConfig}
                                    setBatchConfig={setBatchConfig}
                                    onSubmit={handleBatchSubmit}
                                    isSaving={isSaving}
                                />
                            ) : (
                                <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                                {/* Funcionário e Período */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Funcionário
                                        </label>
                                        <select
                                            className="input-financial"
                                            value={formData.employee_id}
                                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecione</option>
                                            {funcionarios.map((f) => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Mês
                                        </label>
                                        <select
                                            className="input-financial"
                                            value={formData.reference_month}
                                            onChange={(e) => setFormData({ ...formData, reference_month: e.target.value })}
                                        >
                                            {monthNames.map((name, index) => (
                                                <option key={index} value={index + 1}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Ano
                                        </label>
                                        <select
                                            className="input-financial"
                                            value={formData.reference_year}
                                            onChange={(e) => setFormData({ ...formData, reference_year: e.target.value })}
                                        >
                                            {years.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Salário e Horas Extras */}
                                <div className="border-t border-border pt-4">
                                    <h4 className="font-medium text-foreground mb-3">Proventos</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Salário Base
                                            </label>
                                            <CurrencyInput
                                                value={formData.base_salary}
                                                onChange={(v) => setFormData({ ...formData, base_salary: String(v) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Horas Extras (qtd)
                                            </label>
                                            <input
                                                type="number"
                                                className="input-financial"
                                                value={formData.overtime_hours}
                                                onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                                                step="0.5"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Valor Horas Extras
                                            </label>
                                            <CurrencyInput
                                                value={formData.overtime_value}
                                                onChange={(v) => setFormData({ ...formData, overtime_value: String(v) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Benefícios */}
                                <div className="border-t border-border pt-4">
                                    <h4 className="font-medium text-foreground mb-3">Benefícios</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Vale Transporte
                                            </label>
                                            <CurrencyInput
                                                value={formData.transport_allowance}
                                                onChange={(v) => setFormData({ ...formData, transport_allowance: String(v) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Vale Alimentação
                                            </label>
                                            <CurrencyInput
                                                value={formData.meal_allowance}
                                                onChange={(v) => setFormData({ ...formData, meal_allowance: String(v) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Outros Benefícios
                                            </label>
                                            <CurrencyInput
                                                value={formData.other_benefits}
                                                onChange={(v) => setFormData({ ...formData, other_benefits: String(v) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Descontos */}
                                <div className="border-t border-border pt-4">
                                    <h4 className="font-medium text-foreground mb-3">Descontos</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                INSS
                                            </label>
                                            <CurrencyInput
                                                value={formData.inss_discount}
                                                onChange={(v) => setFormData({ ...formData, inss_discount: String(v) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                IRRF
                                            </label>
                                            <CurrencyInput
                                                value={formData.irrf_discount}
                                                onChange={(v) => setFormData({ ...formData, irrf_discount: String(v) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Outros Descontos
                                            </label>
                                            <CurrencyInput
                                                value={formData.other_discounts}
                                                onChange={(v) => setFormData({ ...formData, other_discounts: String(v) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Total Líquido */}
                                <div className="border-t border-border pt-4">
                                    <div className="flex items-center justify-between p-4 bg-income/10 rounded-lg">
                                        <span className="font-medium text-foreground">Salário Líquido:</span>
                                        <span className="text-2xl font-bold text-income">
                                            {formatCurrency(calculatedNetSalary)}
                                        </span>
                                    </div>
                                </div>

                                {/* Observações */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        className="input-financial min-h-[80px]"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Observações adicionais..."
                                    />
                                </div>

                                {/* Ações */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" className="btn-secondary" onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Atualizar' : 'Criar'}
                                        {' '}
                                        Folha
                                    </button>
                                </div>
                            </form>
                            )}
                        </DialogContent>
                    </Dialog>
                    </div>
                </PageHeader>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total de Folhas"
                            value={summary.total}
                            icon={Receipt}
                        />
                        <StatCard
                            label="Pendentes"
                            value={summary.pending}
                            icon={Clock}
                            variant="pending"
                        />
                        <StatCard
                            label="Pagas"
                            value={summary.paid}
                            icon={CheckCircle}
                            variant="income"
                        />
                        <StatCard
                            label="Valor Total"
                            value={formatCurrency(summary.totalValue)}
                            icon={Receipt}
                            variant="expense"
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <select
                            className="input-financial w-auto"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
                        >
                            {monthNames.map((name, index) => (
                                <option key={index} value={index + 1}>{name}</option>
                            ))}
                        </select>
                        <select
                            className="input-financial w-auto"
                            value={filterYear}
                            onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Payrolls List */}
                {payrollsLoading ? (
                    <LoadingState />
                ) : payrolls.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        message="Nenhuma folha de pagamento encontrada"
                    />
                ) : (
                    <div className="card-financial overflow-hidden">
                        <table className="table-financial">
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Período</th>
                                    <th className="text-right">Salário Base</th>
                                    <th className="text-right">Benefícios</th>
                                    <th className="text-right">Descontos</th>
                                    <th className="text-right">Líquido</th>
                                    <th>Status</th>
                                    <th className="w-32" />
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.map((payroll) => {
                                    const totalBenefits = (payroll.transport_allowance || 0)
                                        + (payroll.meal_allowance || 0)
                                        + (payroll.other_benefits || 0)
                                        + (payroll.overtime_value || 0);

                                    const totalDiscounts = (payroll.inss_discount || 0)
                                        + (payroll.irrf_discount || 0)
                                        + (payroll.other_discounts || 0);

                                    return (
                                        <tr key={payroll.id} className="group">
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium text-foreground">
                                                        {payroll.employee?.name || 'Funcionário'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-muted-foreground">
                                                {monthNames[payroll.reference_month - 1]}
                                                /
                                                {payroll.reference_year}
                                            </td>
                                            <td className="text-right font-mono">
                                                {formatCurrency(payroll.base_salary)}
                                            </td>
                                            <td className="text-right font-mono text-income">
                                                +
                                                {formatCurrency(totalBenefits)}
                                            </td>
                                            <td className="text-right font-mono text-expense">
                                                -
                                                {formatCurrency(totalDiscounts)}
                                            </td>
                                            <td className="text-right font-mono font-semibold text-foreground">
                                                {formatCurrency(payroll.net_salary)}
                                            </td>
                                            <td>
                                                {payroll.status === 'pago' ? (
                                                    <span className="badge-success">Pago</span>
                                                ) : (
                                                    <span className="badge-warning">Pendente</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!payroll.financial_entry_id && (
                                                        <button
                                                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                                                            onClick={() => handleGenerateEntry(payroll.id)}
                                                            disabled={isGeneratingEntry}
                                                            title="Gerar lançamento financeiro"
                                                        >
                                                            {isGeneratingEntry ? (
                                                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                            ) : (
                                                                <FileText className="w-4 h-4 text-primary" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                                        onClick={() => openEditModal(payroll)}
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                                        onClick={() => handleDelete(payroll.id, payroll.employee?.name || 'Funcionário')}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
