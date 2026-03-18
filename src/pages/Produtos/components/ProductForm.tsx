import { useMemo } from 'react';
import {
    Loader2, CreditCard, Plus, Trash2,
    Tag, Users, TrendingUp, Settings2, PieChart, Percent, FileCheck,
} from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import type { ProductCategory } from '@/types/database';
import {
    ELIGIBLE_CLIENT_TYPES,
    TARGET_AUDIENCE_OPTIONS,
    BILLING_TYPES,
    COMMISSION_TYPES,
    COMMISSION_RECEIVED_BY_LABELS,
    REQUIRED_DOCS_OPTIONS,
    CARD_BRANDS,
    CARD_MACHINES,
} from '@/constants/products';

export interface MachineFeeTier {
    from: string;
    to: string;
    fee: string;
}

export interface ProductFormData {
    product_type: string;
    name: string;
    code: string;
    description: string;
    commercial_description: string;
    product_category_id: string;
    reference_value: string;
    bank_percentage: string;
    company_percentage: string;
    is_active: boolean;
    // Cartão de crédito específico
    card_brand: string;
    card_machine: string;
    card_machine_fee: string;
    card_machine_fee_tiers: MachineFeeTier[];
    // Tipo de Cliente Elegível
    eligible_client_type: string;
    // Público-alvo
    target_audience: string[];
    // Parâmetros financeiros
    value_min: string;
    value_max: string;
    term_months_min: string;
    term_months_max: string;
    interest_rate_min: string;
    interest_rate_max: string;
    billing_type: string[];
    iof_applicable: boolean;
    iof_percentage: string;
    other_fees_cadastro: string;
    other_fees_operacao: string;
    other_fees_seguro: string;
    // Regras específicas
    specific_rules: string;
    // Comissionamento
    commission_type: string;
    commission_pct: string;
    commission_min: string;
    commission_max: string;
    commission_received_by_product: string;
    commission_received_by_term: string;
    commission_received_by_value: string;
    commission_payment_day: string;
    // Documentação
    required_docs: string[];
    required_docs_other: string;
    // Recorrência (usada na venda vinculada ao produto)
    recurrence_type: string;
}

interface ProductFormProps {
    formData: ProductFormData;
    setFormData: (data: ProductFormData) => void;
    productCategories: ProductCategory[];
    editingId: string | null;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

function ProductFormCalculatedSplit({
    formData,
}: {
    formData: Pick<ProductFormData, 'reference_value' | 'bank_percentage' | 'company_percentage'>;
}) {
    const { reference_value, bank_percentage, company_percentage } = formData;
    const ref = parseFloat(reference_value) || 0;
    const bankPct = parseFloat(bank_percentage) || 0;
    const companyPct = parseFloat(company_percentage) || 0;
    const bankValue = useMemo(() => (ref * bankPct) / 100, [ref, bankPct]);
    const companyValue = useMemo(() => (ref * companyPct) / 100, [ref, companyPct]);

    if (ref <= 0) return null;

    return (
        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
            <span className="text-muted-foreground">Banco: </span>
            <span className="font-medium font-mono">{formatCurrency(bankValue)}</span>
            <span className="text-muted-foreground mx-2">|</span>
            <span className="text-muted-foreground">Empresa: </span>
            <span className="font-medium font-mono">{formatCurrency(companyValue)}</span>
        </div>
    );
}

function toggleArrayItem(arr: string[], value: string): string[] {
    if (arr.includes(value)) return arr.filter((x) => x !== value);
    return [...arr, value];
}

export function ProductForm({
    formData,
    setFormData,
    productCategories,
    editingId,
    isSaving,
    onSubmit,
    onCancel,
}: ProductFormProps) {
    const isCartaoCredito = formData.product_type === 'cartao_credito';

    return (
        <form className="space-y-4 mt-4 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>

            {/* Seção específica: Cartão de Crédito */}
            {isCartaoCredito && (
                <div className="rounded-xl border-2 border-blue-500/40 bg-blue-500/5 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            Configurações do Cartão de Crédito
                        </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Bandeira *
                            </label>
                            <select
                                className="input-financial"
                                value={formData.card_brand}
                                onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                                required={isCartaoCredito}
                            >
                                <option value="">Selecione a bandeira</option>
                                {CARD_BRANDS.map((b) => (
                                    <option key={b.value} value={b.value}>{b.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Máquina / Adquirente *
                            </label>
                            <select
                                className="input-financial"
                                value={formData.card_machine}
                                onChange={(e) => setFormData({ ...formData, card_machine: e.target.value })}
                                required={isCartaoCredito}
                            >
                                <option value="">Selecione a máquina</option>
                                {CARD_MACHINES.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Parcelas mínimas
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="input-financial"
                                placeholder="Ex: 2"
                                value={formData.term_months_min}
                                onChange={(e) => setFormData({ ...formData, term_months_min: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Parcelas máximas
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="input-financial"
                                placeholder="Ex: 18"
                                value={formData.term_months_max}
                                onChange={(e) => setFormData({ ...formData, term_months_max: e.target.value })}
                            />
                        </div>
                    </div>
                    {/* Taxa da maquineta — padrão + faixas variáveis */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-foreground">
                                Taxa da maquineta (%)
                            </label>
                        </div>
                        {/* Taxa padrão / fallback */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="input-financial w-40"
                                placeholder="Ex: 3.99"
                                value={formData.card_machine_fee}
                                onChange={(e) => setFormData({ ...formData, card_machine_fee: e.target.value })}
                            />
                            <span className="text-sm text-muted-foreground">
                                %
                                {formData.card_machine_fee_tiers.length > 0 && ' (fallback)'}
                            </span>
                        </div>

                        {/* Faixas por parcelas */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Taxas por faixa de parcelas
                                </span>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                                    onClick={() => setFormData({
                                        ...formData,
                                        card_machine_fee_tiers: [
                                            ...formData.card_machine_fee_tiers,
                                            { from: '', to: '', fee: '' },
                                        ],
                                    })}
                                >
                                    <Plus className="w-3 h-3" />
                                    Adicionar faixa
                                </button>
                            </div>
                            {formData.card_machine_fee_tiers.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Nenhuma faixa configurada — taxa única usada para todas as parcelas.
                                </p>
                            ) : (
                                <div className="rounded-lg border border-border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 text-xs text-muted-foreground">
                                                <th className="text-left px-3 py-2 font-medium">De (parcelas)</th>
                                                <th className="text-left px-3 py-2 font-medium">Até (parcelas)</th>
                                                <th className="text-left px-3 py-2 font-medium">Taxa (%)</th>
                                                <th className="px-2 py-2" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.card_machine_fee_tiers.map((tier, i) => (
                                                <tr key={i} className="border-t border-border">
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="input-financial w-full"
                                                            placeholder="1"
                                                            value={tier.from}
                                                            onChange={(e) => {
                                                                const tiers = [...formData.card_machine_fee_tiers];
                                                                tiers[i] = { ...tiers[i], from: e.target.value };
                                                                setFormData({ ...formData, card_machine_fee_tiers: tiers });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="input-financial w-full"
                                                            placeholder="12"
                                                            value={tier.to}
                                                            onChange={(e) => {
                                                                const tiers = [...formData.card_machine_fee_tiers];
                                                                tiers[i] = { ...tiers[i], to: e.target.value };
                                                                setFormData({ ...formData, card_machine_fee_tiers: tiers });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                className="input-financial w-full"
                                                                placeholder="3.99"
                                                                value={tier.fee}
                                                                onChange={(e) => {
                                                                    const tiers = [...formData.card_machine_fee_tiers];
                                                                    tiers[i] = { ...tiers[i], fee: e.target.value };
                                                                    setFormData({ ...formData, card_machine_fee_tiers: tiers });
                                                                }}
                                                            />
                                                            <span className="text-muted-foreground shrink-0">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <button
                                                            type="button"
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                            onClick={() => {
                                                                const tiers = formData.card_machine_fee_tiers.filter((_, j) => j !== i);
                                                                setFormData({ ...formData, card_machine_fee_tiers: tiers });
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {formData.card_machine_fee_tiers.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Parcelas fora das faixas usarão a taxa padrão acima.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Taxa de juros mínima aceita (% total)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input-financial"
                                placeholder="Ex: 3.5"
                                value={formData.interest_rate_min}
                                onChange={(e) => setFormData({ ...formData, interest_rate_min: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Taxa de juros máxima aceita (% total)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input-financial"
                                placeholder="Ex: 10"
                                value={formData.interest_rate_max}
                                onChange={(e) => setFormData({ ...formData, interest_rate_max: e.target.value })}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                        Esses campos também aparecem nos Parâmetros Financeiros abaixo com seus valores gerais.
                    </p>
                </div>
            )}

            {/* Identificação */}
            <div className="rounded-xl border-2 border-slate-400/40 bg-slate-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400">
                        <Tag className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Identificação
                    </h4>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nome *</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Nome do produto"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Código interno
                    </label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: EMP-CONS-01"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Categoria
                    </label>
                    <select
                        className="input-financial"
                        value={formData.product_category_id}
                        onChange={(e) => setFormData({ ...formData, product_category_id: e.target.value })}
                    >
                        <option value="">Selecione uma categoria</option>
                        {productCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Descrição
                    </label>
                    <textarea
                        className="input-financial min-h-[80px]"
                        placeholder="Descrição do produto"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Descrição comercial
                    </label>
                    <textarea
                        className="input-financial min-h-[60px]"
                        placeholder="Texto para vendedores e propostas"
                        value={formData.commercial_description}
                        onChange={(e) => setFormData({ ...formData, commercial_description: e.target.value })}
                    />
                </div>
            </div>

            {/* Tipo de Cliente Elegível + Público-alvo */}
            <div className="rounded-xl border-2 border-teal-500/40 bg-teal-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                        Cliente e Público-alvo
                    </h4>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Tipo de Cliente Elegível
                    </label>
                    <select
                        className="input-financial"
                        value={formData.eligible_client_type}
                        onChange={(e) => setFormData({ ...formData, eligible_client_type: e.target.value })}
                    >
                        <option value="">Selecione</option>
                        {ELIGIBLE_CLIENT_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Público-alvo (checklist)
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <Checkbox
                                    checked={formData.target_audience.includes(opt.value)}
                                    onCheckedChange={() => setFormData({
                                        ...formData,
                                        target_audience: toggleArrayItem(
                                            formData.target_audience,
                                            opt.value
                                        ),
                                    })}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Recorrência (venda vinculada)
                    </label>
                    <select
                        className="input-financial"
                        value={formData.recurrence_type}
                        onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                    >
                        <option value="unico">Único</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                        Usada como recorrência da venda quando o produto for vinculado
                    </p>
                </div>
            </div>

            {/* Parâmetros Financeiros */}
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Parâmetros Financeiros do Produto
                    </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Valor mínimo (R$)
                        </label>
                        <CurrencyInput
                            value={formData.value_min}
                            onChange={(numValue) => setFormData({ ...formData, value_min: String(numValue) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Valor máximo (R$)
                        </label>
                        <CurrencyInput
                            value={formData.value_max}
                            onChange={(numValue) => setFormData({ ...formData, value_max: String(numValue) })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            {isCartaoCredito ? 'Parcelas mínimas' : 'Prazo mínimo (meses)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="input-financial"
                            placeholder="0"
                            value={formData.term_months_min}
                            onChange={(e) => setFormData({ ...formData, term_months_min: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            {isCartaoCredito ? 'Parcelas máximas' : 'Prazo máximo (meses)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="input-financial"
                            placeholder="0"
                            value={formData.term_months_max}
                            onChange={(e) => setFormData({ ...formData, term_months_max: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Taxa de juros mínima (% a.m.)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-financial"
                            placeholder="0"
                            value={formData.interest_rate_min}
                            onChange={(e) => setFormData({ ...formData, interest_rate_min: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Taxa de juros máxima (% a.m.)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-financial"
                            placeholder="0"
                            value={formData.interest_rate_max}
                            onChange={(e) => setFormData({ ...formData, interest_rate_max: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Forma de cobrança
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {BILLING_TYPES.map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <Checkbox
                                    checked={formData.billing_type.includes(opt.value)}
                                    onCheckedChange={() => setFormData({
                                        ...formData,
                                        billing_type: toggleArrayItem(
                                            formData.billing_type,
                                            opt.value
                                        ),
                                    })}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="iof_applicable"
                        checked={formData.iof_applicable}
                        onCheckedChange={(checked) => setFormData({
                            ...formData,
                            iof_applicable: checked === true,
                            iof_percentage: checked === true ? formData.iof_percentage : '',
                        })}
                    />
                    <label htmlFor="iof_applicable" className="text-sm font-medium cursor-pointer">
                        IOF aplicável?
                    </label>
                </div>
                {formData.iof_applicable && (
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            % IOF (despesa do produto)
                        </label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="input-financial w-48"
                            placeholder="0.000"
                            value={formData.iof_percentage}
                            onChange={(e) => setFormData({ ...formData, iof_percentage: e.target.value })}
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Outras taxas (R$)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <span className="text-xs text-muted-foreground">Cadastro</span>
                            <CurrencyInput
                                value={formData.other_fees_cadastro}
                                onChange={(numValue) => setFormData({
                                    ...formData,
                                    other_fees_cadastro: String(numValue),
                                })}
                            />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">Operação</span>
                            <CurrencyInput
                                value={formData.other_fees_operacao}
                                onChange={(numValue) => setFormData({
                                    ...formData,
                                    other_fees_operacao: String(numValue),
                                })}
                            />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">Seguro</span>
                            <CurrencyInput
                                value={formData.other_fees_seguro}
                                onChange={(numValue) => setFormData({
                                    ...formData,
                                    other_fees_seguro: String(numValue),
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Regras Específicas */}
            <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Settings2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        Regras Específicas por Produto
                    </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                    Ex.: Consignado (margem mínima, órgãos); FGTS (% antecipação); Veículo (ano
                    mínimo, % FIPE); Cartão (limite, % liberado); Energia (concessionárias).
                </p>
                <textarea
                    className="input-financial min-h-[100px] font-mono text-sm"
                    placeholder='Ex: { "margem_minima_pct": 5, "orgaos_conveniados": "INSS, Estados" }'
                    value={formData.specific_rules}
                    onChange={(e) => setFormData({ ...formData, specific_rules: e.target.value })}
                />
            </div>

            {/* Repartição do valor */}
            <div className="rounded-xl border-2 border-violet-500/40 bg-violet-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                        <PieChart className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        Repartição do valor
                    </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                    Valor de referência e percentuais (banco + empresa = 100%). Ao alterar um, o outro
                    é preenchido automaticamente. Valores em R$ são calculados a partir do valor de referência.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Valor de referência (R$)
                        </label>
                        <CurrencyInput
                            value={formData.reference_value}
                            onChange={(numValue) => setFormData({ ...formData, reference_value: String(numValue) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            % Banco
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="input-financial"
                            placeholder="0"
                            value={formData.bank_percentage}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const bank = Math.min(100, Math.max(0, parseFloat(raw) || 0));
                                const company = Math.round((100 - bank) * 100) / 100;
                                setFormData({
                                    ...formData,
                                    bank_percentage: raw === '' ? '' : String(bank),
                                    company_percentage: raw === '' ? '100' : String(company),
                                });
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            % Empresa
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="input-financial"
                            placeholder="0"
                            value={formData.company_percentage}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const company = Math.min(100, Math.max(0, parseFloat(raw) || 0));
                                const bank = Math.round((100 - company) * 100) / 100;
                                setFormData({
                                    ...formData,
                                    company_percentage: raw === '' ? '' : String(company),
                                    bank_percentage: raw === '' ? '100' : String(bank),
                                });
                            }}
                        />
                    </div>
                </div>
                <ProductFormCalculatedSplit formData={formData} />
            </div>

            {/* Comissionamento */}
            <div className="rounded-xl border-2 border-yellow-500/40 bg-yellow-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                        <Percent className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                        Comissionamento
                    </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tipo de comissão
                        </label>
                        <select
                            className="input-financial"
                            value={formData.commission_type}
                            onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                        >
                            <option value="">Selecione</option>
                            {COMMISSION_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            % de comissão
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-financial"
                            placeholder="0"
                            value={formData.commission_pct}
                            onChange={(e) => setFormData({ ...formData, commission_pct: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Comissão mínima (vendedor, R$)
                        </label>
                        <CurrencyInput
                            value={formData.commission_min}
                            onChange={(numValue) => setFormData({ ...formData, commission_min: String(numValue) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Comissão máxima (vendedor, R$)
                        </label>
                        <CurrencyInput
                            value={formData.commission_max}
                            onChange={(numValue) => setFormData({ ...formData, commission_max: String(numValue) })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Comissão recebida da instituição conveniada
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <span className="text-xs text-muted-foreground">
                                {COMMISSION_RECEIVED_BY_LABELS.by_product}
                                {' '}
                                (R$)
                            </span>
                            <CurrencyInput
                                value={formData.commission_received_by_product}
                                onChange={(numValue) => setFormData({
                                    ...formData,
                                    commission_received_by_product: String(numValue),
                                })}
                            />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">
                                {COMMISSION_RECEIVED_BY_LABELS.by_term}
                                {' '}
                                (R$)
                            </span>
                            <CurrencyInput
                                value={formData.commission_received_by_term}
                                onChange={(numValue) => setFormData({
                                    ...formData,
                                    commission_received_by_term: String(numValue),
                                })}
                            />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">
                                {COMMISSION_RECEIVED_BY_LABELS.by_value}
                                {' '}
                                (R$)
                            </span>
                            <CurrencyInput
                                value={formData.commission_received_by_value}
                                onChange={(numValue) => setFormData({
                                    ...formData,
                                    commission_received_by_value: String(numValue),
                                })}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Dia do mês para pagamento da comissão
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="input-financial w-24"
                        placeholder="Ex: 10"
                        value={formData.commission_payment_day}
                        onChange={(e) => setFormData({
                            ...formData,
                            commission_payment_day: e.target.value,
                        })}
                    />
                </div>
            </div>

            {/* Documentação Exigida */}
            <div className="rounded-xl border-2 border-indigo-500/40 bg-indigo-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        <FileCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        Documentação Exigida
                    </h4>
                </div>
                <div className="flex flex-wrap gap-4 mb-3">
                    {REQUIRED_DOCS_OPTIONS.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                            <Checkbox
                                checked={formData.required_docs.includes(opt.value)}
                                onCheckedChange={() => setFormData({
                                    ...formData,
                                    required_docs: toggleArrayItem(
                                        formData.required_docs,
                                        opt.value
                                    ),
                                })}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
                {formData.required_docs.includes('outros') && (
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Outros (especificar)
                        </label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="Ex: Certidão negativa, contrato social..."
                            value={formData.required_docs_other}
                            onChange={(e) => setFormData({ ...formData, required_docs_other: e.target.value })}
                        />
                    </div>
                )}
            </div>

            {/* Ativo */}
            <div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm font-medium text-foreground">Produto ativo</span>
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-2">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? 'Atualizar' : 'Criar'}
                    {' '}
                    Produto
                </button>
            </div>
        </form>
    );
}
