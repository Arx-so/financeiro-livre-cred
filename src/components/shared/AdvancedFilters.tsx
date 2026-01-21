import { useState, useCallback } from 'react';
import {
    Filter, X, Save, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategorias';
import { useFavorecidos } from '@/hooks/useCadastros';
import { useBranches } from '@/hooks/useBranches';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface FilterValues {
    startDate?: string;
    endDate?: string;
    status?: string;
    categoryId?: string;
    subcategoryId?: string;
    favorecidoId?: string;
    branchId?: string;
    bankAccountId?: string;
    type?: 'receita' | 'despesa' | '';
}

interface AdvancedFiltersProps {
    filters: FilterValues;
    onChange: (filters: FilterValues) => void;
    showStatus?: boolean;
    showType?: boolean;
    showCategory?: boolean;
    showFavorecido?: boolean;
    showBranch?: boolean;
    showBankAccount?: boolean;
    statusOptions?: { value: string; label: string }[];
    storageKey?: string;
}

const defaultStatusOptions = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'atrasado', label: 'Atrasado' },
    { value: 'cancelado', label: 'Cancelado' },
];

export function AdvancedFilters({
    filters,
    onChange,
    showStatus = true,
    showType = true,
    showCategory = true,
    showFavorecido = true,
    showBranch = false,
    showBankAccount = false,
    statusOptions = defaultStatusOptions,
    storageKey,
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [savedFilters, setSavedFilters] = useState<{ name: string; filters: FilterValues }[]>(() => {
        if (storageKey) {
            try {
                const stored = localStorage.getItem(`filters_${storageKey}`);
                return stored ? JSON.parse(stored) : [];
            } catch {
                return [];
            }
        }
        return [];
    });

    const { data: categories } = useCategories();
    const { data: favorecidos } = useFavorecidos({});
    const { data: branches } = useBranches();
    const { data: bankAccounts } = useBankAccounts();

    const handleChange = useCallback(
        (key: keyof FilterValues, value: string) => {
            onChange({ ...filters, [key]: value || undefined });
        },
        [filters, onChange]
    );

    const handleClearAll = useCallback(() => {
        onChange({});
    }, [onChange]);

    const handleSaveFilter = useCallback(() => {
        const name = prompt('Nome do filtro:');
        if (name && storageKey) {
            const newSaved = [...savedFilters, { name, filters }];
            setSavedFilters(newSaved);
            localStorage.setItem(`filters_${storageKey}`, JSON.stringify(newSaved));
        }
    }, [filters, savedFilters, storageKey]);

    const handleLoadFilter = useCallback(
        (savedFilter: FilterValues) => {
            onChange(savedFilter);
        },
        [onChange]
    );

    const handleDeleteSavedFilter = useCallback(
        (index: number) => {
            if (storageKey) {
                const newSaved = savedFilters.filter((_, i) => i !== index);
                setSavedFilters(newSaved);
                localStorage.setItem(`filters_${storageKey}`, JSON.stringify(newSaved));
            }
        },
        [savedFilters, storageKey]
    );

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="card-financial">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">Filtros Avançados</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </div>
                        {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-4 border-t border-border">
                        {/* Date range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">
                                    Data Inicial
                                </label>
                                <input
                                    type="date"
                                    className="input-financial"
                                    value={filters.startDate || ''}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">
                                    Data Final
                                </label>
                                <input
                                    type="date"
                                    className="input-financial"
                                    value={filters.endDate || ''}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>

                            {showType && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        className="input-financial"
                                        value={filters.type || ''}
                                        onChange={(e) => handleChange(
                                            'type', e.target.value as 'receita' | 'despesa' | ''
                                        )}
                                    >
                                        <option value="">Todos</option>
                                        <option value="receita">Receita</option>
                                        <option value="despesa">Despesa</option>
                                    </select>
                                </div>
                            )}

                            {showStatus && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="input-financial"
                                        value={filters.status || ''}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Second row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {showCategory && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Categoria
                                    </label>
                                    <select
                                        className="input-financial"
                                        value={filters.categoryId || ''}
                                        onChange={(e) => handleChange('categoryId', e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {categories?.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showFavorecido && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Favorecido
                                    </label>
                                    <select
                                        className="input-financial"
                                        value={filters.favorecidoId || ''}
                                        onChange={(e) => handleChange('favorecidoId', e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        {favorecidos?.map((fav) => (
                                            <option key={fav.id} value={fav.id}>
                                                {fav.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showBranch && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Filial
                                    </label>
                                    <select
                                        className="input-financial"
                                        value={filters.branchId || ''}
                                        onChange={(e) => handleChange('branchId', e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {branches?.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showBankAccount && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Conta Bancária
                                    </label>
                                    <select
                                        className="input-financial"
                                        value={filters.bankAccountId || ''}
                                        onChange={(e) => handleChange('bankAccountId', e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {bankAccounts?.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name}
                                                {' '}
                                                -
                                                {' '}
                                                {acc.bank_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn-secondary py-1.5 px-3 text-sm"
                                    onClick={handleClearAll}
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Limpar Filtros
                                </button>

                                {storageKey && (
                                    <button
                                        className="btn-secondary py-1.5 px-3 text-sm"
                                        onClick={handleSaveFilter}
                                        disabled={activeFiltersCount === 0}
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Salvar Filtro
                                    </button>
                                )}
                            </div>

                            {/* Saved filters */}
                            {storageKey && savedFilters.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Salvos:</span>
                                    {savedFilters.map((saved, index) => (
                                        <div key={index} className="flex items-center">
                                            <button
                                                className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-l"
                                                onClick={() => handleLoadFilter(saved.filters)}
                                            >
                                                {saved.name}
                                            </button>
                                            <button
                                                className="text-xs bg-muted hover:bg-destructive/20 px-1.5 py-1 rounded-r border-l border-border"
                                                onClick={() => handleDeleteSavedFilter(index)}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export default AdvancedFilters;
