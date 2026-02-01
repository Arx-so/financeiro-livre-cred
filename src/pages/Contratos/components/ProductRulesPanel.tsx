import { useMemo } from 'react';
import {
    BILLING_TYPES,
    COMMISSION_RECEIVED_BY_LABELS,
    COMMISSION_TYPES,
    ELIGIBLE_CLIENT_TYPES,
    REQUIRED_DOCS_OPTIONS,
    TARGET_AUDIENCE_OPTIONS,
} from '@/constants/products';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types/database';
import type { ProductWithCategory } from '@/services/products';

interface ProductRulesPanelProps {
    product: ProductWithCategory | Product;
    /** Valor da venda para calcular repartição (opcional) */
    saleValue?: number;
}

function labelFor<T extends { value: string; label: string }>(options: readonly T[], value: string): string {
    return options.find((o) => o.value === value)?.label ?? value;
}

export function ProductRulesPanel({ product, saleValue }: ProductRulesPanelProps) {
    const valueForSplit = saleValue ?? product.bank_value ?? 0;
    const bankPct = product.bank_percentage ?? 0;
    const companyPct = product.company_percentage ?? 0;
    const reparticao = useMemo(() => {
        if (valueForSplit <= 0) return null;
        return {
            bank: (valueForSplit * bankPct) / 100,
            company: (valueForSplit * companyPct) / 100,
        };
    }, [valueForSplit, bankPct, companyPct]);

    const requiredDocs = product.required_docs ?? [];
    const billingType = product.billing_type ?? [];
    const targetAudience = product.target_audience ?? [];
    const specificRules = product.specific_rules;
    const commissionReceived = product.commission_received_by;
    const eligibleLabel = product.eligible_client_type
        ? labelFor(ELIGIBLE_CLIENT_TYPES, product.eligible_client_type)
        : null;

    return (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Regras do produto vinculado
            </h4>

            {/* Documentação Exigida */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Documentação Exigida
                </p>
                <ul className="text-sm text-foreground list-disc list-inside space-y-0.5">
                    {requiredDocs.length === 0 && !product.required_docs_other && (
                        <li className="text-muted-foreground">Nenhuma documentação configurada</li>
                    )}
                    {requiredDocs.map((docKey) => {
                        const opt = REQUIRED_DOCS_OPTIONS.find((o) => o.value === docKey);
                        return (
                            <li key={docKey}>{opt ? opt.label : docKey}</li>
                        );
                    })}
                    {product.required_docs_other && (
                        <li>
                            Outros:
                            {' '}
                            {product.required_docs_other}
                        </li>
                    )}
                </ul>
            </div>

            {/* Comissionamento */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Comissionamento
                </p>
                <div className="text-sm text-foreground space-y-1">
                    {product.commission_type && (
                        <p>
                            Tipo:
                            {' '}
                            {labelFor(COMMISSION_TYPES, product.commission_type)}
                            {product.commission_pct != null && (
                                <>
                                    {' '}
                                    —
                                    {' '}
                                    {product.commission_type === 'percentual'
                                        ? `${product.commission_pct}%`
                                        : formatCurrency(product.commission_pct)}
                                </>
                            )}
                        </p>
                    )}
                    {(product.commission_min != null || product.commission_max != null) && (
                        <p>
                            Faixa vendedor:
                            {' '}
                            {product.commission_min != null && formatCurrency(product.commission_min)}
                            {product.commission_max != null && ` a ${formatCurrency(product.commission_max)}`}
                        </p>
                    )}
                    {commissionReceived && (
                        <p className="text-muted-foreground">
                            Comissão instituição:
                            {' '}
                            {[
                                commissionReceived.by_product != null &&
                                    `${COMMISSION_RECEIVED_BY_LABELS.by_product}: ${commissionReceived.by_product}`,
                                commissionReceived.by_term != null &&
                                    `${COMMISSION_RECEIVED_BY_LABELS.by_term}: ${commissionReceived.by_term}`,
                                commissionReceived.by_value != null &&
                                    `${COMMISSION_RECEIVED_BY_LABELS.by_value}: ${commissionReceived.by_value}`,
                            ]
                                .filter(Boolean)
                                .join(' | ')}
                        </p>
                    )}
                    {product.commission_payment_day != null && (
                        <p>
                            Pagamento comissão: dia
                            {' '}
                            {product.commission_payment_day}
                        </p>
                    )}
                    {!product.commission_type && !commissionReceived && product.commission_payment_day == null && (
                        <p className="text-muted-foreground">Não configurado</p>
                    )}
                </div>
            </div>

            {/* Repartição do valor */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Repartição do valor
                </p>
                <div className="text-sm text-foreground">
                    <p>
                        Banco:
                        {' '}
                        {bankPct}
                        %
                        {companyPct > 0 && (
                            <>
                                {' '}
                                | Empresa:
                                {' '}
                                {companyPct}
                                %
                            </>
                        )}
                    </p>
                    {reparticao && valueForSplit > 0 && (
                        <p className="mt-1 font-mono text-muted-foreground">
                            Para valor
                            {' '}
                            {formatCurrency(valueForSplit)}
                            {' '}
                            → Banco:
                            {' '}
                            {formatCurrency(reparticao.bank)}
                            {' '}
                            | Empresa:
                            {' '}
                            {formatCurrency(reparticao.company)}
                        </p>
                    )}
                </div>
            </div>

            {/* Regras Específicas */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Regras Específicas
                </p>
                <div className="text-sm text-foreground">
                    {specificRules && typeof specificRules === 'object' && Object.keys(specificRules).length > 0 ? (
                        <pre className="bg-muted/50 p-2 rounded font-mono text-xs whitespace-pre-wrap break-words">
                            {JSON.stringify(specificRules, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-muted-foreground">Nenhuma regra específica configurada</p>
                    )}
                </div>
            </div>

            {/* Forma de cobrança */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Forma de cobrança
                </p>
                <div className="text-sm text-foreground flex flex-wrap gap-2">
                    {billingType.length === 0 ? (
                        <span className="text-muted-foreground">Não configurado</span>
                    ) : (
                        billingType.map((b) => (
                            <span
                                key={b}
                                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5"
                            >
                                {labelFor(BILLING_TYPES, b)}
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* Cliente e Público-alvo */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Cliente e Público-alvo
                </p>
                <div className="text-sm text-foreground space-y-1">
                    {eligibleLabel && <p>Tipo elegível: {eligibleLabel}</p>}
                    {targetAudience.length > 0 ? (
                        <p>
                            Público-alvo:
                            {' '}
                            {targetAudience
                                .map((t) => TARGET_AUDIENCE_OPTIONS.find((o) => o.value === t)?.label ?? t)
                                .join(', ')}
                        </p>
                    ) : (
                        !eligibleLabel && <p className="text-muted-foreground">Não configurado</p>
                    )}
                </div>
            </div>

            {/* Parâmetros Financeiros do Produto (impactam na criação da venda) */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Parâmetros financeiros do produto
                </p>
                <div className="text-sm text-foreground space-y-1">
                    {(product.value_min != null || product.value_max != null) && (
                        <p>
                            Valor permitido:
                            {' '}
                            {product.value_min != null && formatCurrency(product.value_min)}
                            {product.value_min != null && product.value_max != null && ' a '}
                            {product.value_max != null && formatCurrency(product.value_max)}
                        </p>
                    )}
                    {(product.term_months_min != null || product.term_months_max != null) && (
                        <p>
                            Prazo (meses):
                            {' '}
                            {product.term_months_min ?? '—'}
                            {' a '}
                            {product.term_months_max ?? '—'}
                        </p>
                    )}
                    {(product.interest_rate_min != null || product.interest_rate_max != null) && (
                        <p>
                            Taxa de juros (a.m.):
                            {' '}
                            {product.interest_rate_min ?? '—'}
                            % a
                            {' '}
                            {product.interest_rate_max ?? '—'}
                            %
                        </p>
                    )}
                    {product.iof_applicable && <p>IOF aplicável: Sim</p>}
                    {product.value_min == null &&
                        product.value_max == null &&
                        product.term_months_min == null &&
                        product.term_months_max == null &&
                        !product.iof_applicable && (
                            <p className="text-muted-foreground">Nenhum parâmetro financeiro configurado</p>
                        )}
                </div>
            </div>
        </div>
    );
}
