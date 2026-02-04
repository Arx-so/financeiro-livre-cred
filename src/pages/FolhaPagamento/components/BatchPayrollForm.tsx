import {
    Loader2, Users, Calendar, Repeat
} from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/utils';
import { calculateNetSalary } from '@/services/folhaPagamento';
import { useHiringCategories, useEmployeesByFilters } from '@/hooks/useFolhaPagamento';
import { useHiringCategoriesFromStorage } from './HiringCategoriesManager';
import type { BatchPayrollConfig } from '@/services/folhaPagamento';

interface BatchPayrollFormProps {
    branchId: string;
    formData: {
        reference_month: string;
        reference_year: string;
        base_salary: string;
        overtime_hours: string;
        overtime_value: string;
        transport_allowance: string;
        meal_allowance: string;
        other_benefits: string;
        inss_discount: string;
        irrf_discount: string;
        other_discounts: string;
        notes: string;
    };
    setFormData: (data: any) => void;
    batchConfig: {
        filterType: 'all' | 'category';
        categoria_contratacao?: string;
        is_recurring: boolean;
        recurrence_type: 'infinite' | 'fixed_months' | null;
        recurrence_months: number;
    };
    setBatchConfig: (config: any) => void;
    onSubmit: (config: BatchPayrollConfig) => void;
    isSaving: boolean;
}

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function BatchPayrollForm({
    branchId,
    formData,
    setFormData,
    batchConfig,
    setBatchConfig,
    onSubmit,
    isSaving,
}: BatchPayrollFormProps) {
    // Use categories from storage (configured) first, fallback to database
    const storageCategories = useHiringCategoriesFromStorage();
    const { data: dbCategories = [], isLoading: categoriesLoading } = useHiringCategories();

    // Merge and deduplicate categories
    const hiringCategories = Array.from(new Set([...storageCategories, ...dbCategories])).sort();

    const { data: employees = [], isLoading: employeesLoading } = useEmployeesByFilters({
        categoria_contratacao: batchConfig.filterType === 'category' ? batchConfig.categoria_contratacao : undefined,
    });

    // Calcular salário líquido
    const calculatedNetSalary = calculateNetSalary({
        base_salary: parseFloat(formData.base_salary) || 0,
        overtime_value: parseFloat(formData.overtime_value) || 0,
        transport_allowance: parseFloat(formData.transport_allowance) || 0,
        meal_allowance: parseFloat(formData.meal_allowance) || 0,
        other_benefits: parseFloat(formData.other_benefits) || 0,
        inss_discount: parseFloat(formData.inss_discount) || 0,
        irrf_discount: parseFloat(formData.irrf_discount) || 0,
        other_discounts: parseFloat(formData.other_discounts) || 0,
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (batchConfig.filterType === 'category' && !batchConfig.categoria_contratacao) {
            return;
        }

        const config: BatchPayrollConfig = {
            branch_id: branchId,
            categoria_contratacao: batchConfig.filterType === 'category' ? batchConfig.categoria_contratacao : undefined,
            reference_month: parseInt(formData.reference_month, 10),
            reference_year: parseInt(formData.reference_year, 10),
            base_salary: parseFloat(formData.base_salary) || 0,
            overtime_hours: parseFloat(formData.overtime_hours) || 0,
            overtime_value: parseFloat(formData.overtime_value) || 0,
            transport_allowance: parseFloat(formData.transport_allowance) || 0,
            meal_allowance: parseFloat(formData.meal_allowance) || 0,
            other_benefits: parseFloat(formData.other_benefits) || 0,
            inss_discount: parseFloat(formData.inss_discount) || 0,
            irrf_discount: parseFloat(formData.irrf_discount) || 0,
            other_discounts: parseFloat(formData.other_discounts) || 0,
            notes: formData.notes || undefined,
            is_recurring: batchConfig.is_recurring,
            recurrence_type: batchConfig.recurrence_type || undefined,
            recurrence_months: batchConfig.recurrence_type === 'fixed_months' ? batchConfig.recurrence_months : undefined,
        };

        onSubmit(config);
    };

    return (
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {/* Filtros de Funcionários */}
            <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Selecionar Funcionários
                </h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tipo de Seleção
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="filterType"
                                    value="all"
                                    checked={batchConfig.filterType === 'all'}
                                    onChange={(e) => setBatchConfig({ ...batchConfig, filterType: e.target.value as 'all' | 'category' })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Todos os funcionários da filial</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="filterType"
                                    value="category"
                                    checked={batchConfig.filterType === 'category'}
                                    onChange={(e) => setBatchConfig({ ...batchConfig, filterType: e.target.value as 'all' | 'category' })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Por categoria de contratação</span>
                            </label>
                        </div>
                    </div>

                    {batchConfig.filterType === 'category' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Categoria de Contratação
                            </label>
                            {categoriesLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Carregando categorias...</span>
                                </div>
                            ) : (
                                <select
                                    className="input-financial"
                                    value={batchConfig.categoria_contratacao || ''}
                                    onChange={(e) => setBatchConfig({ ...batchConfig, categoria_contratacao: e.target.value })}
                                    required={batchConfig.filterType === 'category'}
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {hiringCategories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Preview de funcionários */}
                    {batchConfig.filterType === 'category' && batchConfig.categoria_contratacao && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                            {employeesLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Carregando funcionários...</span>
                                </div>
                            ) : (
                                <div className="text-sm">
                                    <span className="font-medium text-foreground">
                                        {employees.length}
                                        {' '}
                                        funcionário(s) encontrado(s)
                                    </span>
                                    {employees.length > 0 && (
                                        <div className="mt-2 max-h-32 overflow-y-auto">
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                {employees.slice(0, 10).map((emp) => (
                                                    <li key={emp.id}>{emp.name}</li>
                                                ))}
                                                {employees.length > 10 && (
                                                    <li className="text-xs">
                                                        ... e mais
                                                        {' '}
                                                        {employees.length - 10}
                                                        {' '}
                                                        funcionário(s)
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Período */}
            <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Período
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Mês
                        </label>
                        <select
                            className="input-financial"
                            value={formData.reference_month}
                            onChange={(e) => setFormData({ ...formData, reference_month: e.target.value })}
                            required
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
                            required
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
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
                    <span className="font-medium text-foreground">Salário Líquido (por funcionário):</span>
                    <span className="text-2xl font-bold text-income">
                        {formatCurrency(calculatedNetSalary)}
                    </span>
                </div>
            </div>

            {/* Recorrência */}
            <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Recorrência
                </h4>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={batchConfig.is_recurring}
                            onChange={(e) => setBatchConfig({
                                ...batchConfig,
                                is_recurring: e.target.checked,
                                recurrence_type: e.target.checked ? 'infinite' : null,
                            })}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-foreground">Criar folha recorrente</span>
                    </label>

                    {batchConfig.is_recurring && (
                        <div className="pl-6 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Tipo de Recorrência
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence_type"
                                            value="infinite"
                                            checked={batchConfig.recurrence_type === 'infinite'}
                                            onChange={(e) => setBatchConfig({
                                                ...batchConfig,
                                                recurrence_type: e.target.value as 'infinite' | 'fixed_months',
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Sem fim (mensal)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence_type"
                                            value="fixed_months"
                                            checked={batchConfig.recurrence_type === 'fixed_months'}
                                            onChange={(e) => setBatchConfig({
                                                ...batchConfig,
                                                recurrence_type: e.target.value as 'infinite' | 'fixed_months',
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Por X meses</span>
                                    </label>
                                </div>
                            </div>

                            {batchConfig.recurrence_type === 'fixed_months' && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Número de Meses
                                    </label>
                                    <input
                                        type="number"
                                        className="input-financial"
                                        value={batchConfig.recurrence_months}
                                        onChange={(e) => setBatchConfig({
                                            ...batchConfig,
                                            recurrence_months: parseInt(e.target.value, 10) || 1,
                                        })}
                                        min="1"
                                        max="24"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Serão criadas folhas para os próximos
                                        {' '}
                                        {batchConfig.recurrence_months}
                                        {' '}
                                        mês(es)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
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
                <button type="submit" className="btn-primary" disabled={isSaving || (batchConfig.filterType === 'category' && !batchConfig.categoria_contratacao)}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Criar Folhas em Lote
                </button>
            </div>
        </form>
    );
}
