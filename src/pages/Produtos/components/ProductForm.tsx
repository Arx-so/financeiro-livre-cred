import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
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
} from '@/constants/products';

export interface ProductFormData {
    name: string;
    code: string;
    description: string;
    commercial_description: string;
    product_category_id: string;
    reference_value: string;
    bank_percentage: string;
    company_percentage: string;
    is_active: boolean;
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
    return (
        <form className="space-y-4 mt-4 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>
            {/* Identificação */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">
                    Identificação
                </h4>
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
            <div className="border-t border-border pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">
                    Cliente e Público-alvo
                </h4>
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
            <div className="border-t border-border pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">
                    Parâmetros Financeiros do Produto
                </h4>
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
                            Prazo mínimo (meses)
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
                            Prazo máximo (meses)
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
            <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1 mb-2">
                    Regras Específicas por Produto
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
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
            <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1 mb-3">
                    Repartição do valor
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
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
            <div className="border-t border-border pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">
                    Comissionamento
                </h4>
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
            <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1 mb-2">
                    Documentação Exigida
                </h4>
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
            <div className="border-t border-border pt-4">
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
