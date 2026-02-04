import {
    Package, Edit, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProductWithCategory } from '@/services/products';
import {
    ELIGIBLE_CLIENT_TYPES,
    TARGET_AUDIENCE_OPTIONS,
    BILLING_TYPES,
    REQUIRED_DOCS_OPTIONS,
} from '@/constants/products';

interface ProductCardProps {
    product: ProductWithCategory;
    onEdit: (product: ProductWithCategory) => void;
    onDelete: (id: string, name: string) => void;
    onToggleActive?: (id: string, isActive: boolean) => void;
}

function labelFor(value: string, options: readonly { value: string; label: string }[]): string {
    return options.find((o) => o.value === value)?.label ?? value;
}

export function ProductCard({
    product, onEdit, onDelete, onToggleActive
}: ProductCardProps) {
    const targetAudience = Array.isArray(product.target_audience) ? product.target_audience : [];
    const billingType = Array.isArray(product.billing_type) ? product.billing_type : [];
    const requiredDocs = Array.isArray(product.required_docs) ? product.required_docs : [];
    const hasParams = (product.value_min != null && product.value_min > 0)
        || (product.value_max != null && product.value_max > 0)
        || (product.term_months_min != null && product.term_months_min > 0)
        || (product.term_months_max != null && product.term_months_max > 0);

    return (
        <div className="card-financial p-5 group">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            {product.code && (
                                <span className="text-xs text-muted-foreground font-mono">{product.code}</span>
                            )}
                            {!product.is_active && (
                                <span className="badge-neutral text-xs">Inativo</span>
                            )}
                        </div>
                        {(product.description || product.commercial_description) && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.commercial_description || product.description}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {product.product_category && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                                    {product.product_category.name}
                                </span>
                            )}
                            {product.eligible_client_type && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                                    {labelFor(product.eligible_client_type, ELIGIBLE_CLIENT_TYPES)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {targetAudience.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Público-alvo</p>
                    <p className="text-sm text-foreground">
                        {targetAudience.map((v) => labelFor(v, TARGET_AUDIENCE_OPTIONS)).join(', ')}
                    </p>
                </div>
            )}

            {hasParams && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border text-sm">
                    {(product.value_min != null && product.value_min > 0)
                        || (product.value_max != null && product.value_max > 0) ? (
                            <div>
                                <p className="text-xs text-muted-foreground">Valor</p>
                                <p className="font-mono">
                                    {product.value_min != null && product.value_min > 0
                                        ? formatCurrency(product.value_min)
                                        : '—'}
                                    {' → '}
                                    {product.value_max != null && product.value_max > 0
                                        ? formatCurrency(product.value_max)
                                        : '—'}
                                </p>
                            </div>
                        ) : null}
                    {(product.term_months_min != null && product.term_months_min > 0)
                        || (product.term_months_max != null && product.term_months_max > 0) ? (
                            <div>
                                <p className="text-xs text-muted-foreground">Prazo (meses)</p>
                                <p className="font-mono">
                                    {product.term_months_min ?? '—'}
                                    {' '}
                                    a
                                    {' '}
                                    {product.term_months_max ?? '—'}
                                </p>
                            </div>
                        ) : null}
                </div>
            )}

            {billingType.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Forma de cobrança</p>
                    <p className="text-sm text-foreground">
                        {billingType.map((v) => labelFor(v, BILLING_TYPES)).join(', ')}
                    </p>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-semibold font-mono text-primary">
                        {formatCurrency((product.bank_value ?? 0) + (product.company_value ?? 0))}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Valor Banco</p>
                        <p className="font-semibold font-mono text-foreground">
                            {formatCurrency(product.bank_value)}
                            {product.bank_percentage > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    (
                                    {product.bank_percentage}
                                    %)
                                </span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Valor Empresa</p>
                        <p className="font-semibold font-mono text-foreground">
                            {formatCurrency(product.company_value)}
                            {product.company_percentage > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    (
                                    {product.company_percentage}
                                    %)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {requiredDocs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Documentação exigida</p>
                    <p className="text-xs text-foreground line-clamp-2">
                        {requiredDocs
                            .map((v) => (v === 'outros' && product.required_docs_other
                                ? `Outros (${product.required_docs_other})`
                                : labelFor(v, REQUIRED_DOCS_OPTIONS)))
                            .join(', ')}
                    </p>
                </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button
                    className="btn-secondary py-2 flex-1"
                    onClick={() => onEdit(product)}
                >
                    <Edit className="w-4 h-4" />
                    Editar
                </button>
                {onToggleActive && (
                    <button
                        className="btn-secondary py-2"
                        onClick={() => onToggleActive(product.id, !product.is_active)}
                        title={product.is_active ? 'Desativar' : 'Ativar'}
                    >
                        {product.is_active ? (
                            <ToggleRight className="w-4 h-4 text-income" />
                        ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>
                )}
                <button
                    className="btn-secondary py-2 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(product.id, product.name)}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
