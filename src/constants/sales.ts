// ============================================
// Sales Module Constants
// Constantes do Módulo de Vendas
// ============================================

export const PAYMENT_METHODS = {
    ESPECIE: 'especie',
    PIX: 'pix',
    TEC: 'tec',
    PIX_ESPECIE: 'pix_especie',
} as const;

export type PaymentMethodSales = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    especie: 'Espécie (Dinheiro)',
    pix: 'PIX',
    tec: 'TEC (Transferência)',
    pix_especie: 'PIX | Espécie',
};

export const TERMINALS = {
    SUMUP_W: 'sumup_w',
    SUMUP_R: 'sumup_r',
    SUMUP_H: 'sumup_h',
    LARANJINHA_H: 'laranjinha_h',
    C6_R: 'c6_r',
    PAGUE_VELOZ: 'pague_veloz',
    MERCADO_PAGO_R: 'mercado_pago_r',
    PAGBANK_H: 'pagbank_h',
} as const;

export type Terminal = typeof TERMINALS[keyof typeof TERMINALS];

export const TERMINAL_LABELS: Record<string, string> = {
    sumup_w: 'Sumup W',
    sumup_r: 'Sumup R',
    sumup_h: 'Sumup H',
    laranjinha_h: 'Laranjinha H',
    c6_r: 'C6 R',
    pague_veloz: 'Pague Veloz',
    mercado_pago_r: 'Mercado Pago R',
    pagbank_h: 'Pagbank H',
};

export const CARD_BRANDS = {
    MASTER: 'master',
    VISA: 'visa',
    ELO: 'elo',
    AMEX: 'amex',
    HIPER: 'hiper',
} as const;

export type CardBrand = typeof CARD_BRANDS[keyof typeof CARD_BRANDS];

export const CARD_BRAND_LABELS: Record<string, string> = {
    master: 'Mastercard',
    visa: 'Visa',
    elo: 'Elo',
    amex: 'American Express',
    hiper: 'Hipercard',
};

export const TRANSFER_SOURCES = {
    TF_CENTRAL: 'tf_central',
    TF_RENTA: 'tf_renta',
    TF_RALF: 'tf_ralf',
} as const;

export type TransferSource = typeof TRANSFER_SOURCES[keyof typeof TRANSFER_SOURCES];

export const TRANSFER_SOURCE_LABELS: Record<string, string> = {
    tf_central: 'TF CENTRAL',
    tf_renta: 'TF RENTA',
    tf_ralf: 'TF RALF',
};

export const SALE_TYPES = {
    VENDA_NOVA: 'venda_nova',
    CASA: 'casa',
} as const;

export type SaleType = typeof SALE_TYPES[keyof typeof SALE_TYPES];

export const SALE_TYPE_LABELS: Record<string, string> = {
    venda_nova: 'Venda Nova',
    casa: 'Casa',
};

export const CREDIT_CARD_SALE_STATUSES = {
    PENDENTE: 'pendente',
    PAGO: 'pago',
    CANCELADO: 'cancelado',
} as const;

export const DPLUS_SALE_STATUSES = {
    PENDENTE: 'pendente',
    ATIVO: 'ativo',
    CANCELADO: 'cancelado',
} as const;

export const DPLUS_PAYMENT_METHODS = {
    PIX: 'pix',
    TRANSFERENCIA: 'transferencia',
    CHEQUE: 'cheque',
    ESPECIE: 'especie',
} as const;

export const DPLUS_PAYMENT_METHOD_LABELS: Record<string, string> = {
    pix: 'PIX',
    transferencia: 'Transferência Bancária',
    cheque: 'Cheque',
    especie: 'Espécie',
};

export const DPLUS_PAYMENT_METHODS_WITH_INFO: string[] = ['pix', 'transferencia'];

// ============================================
// Produção — quanto da venda de cartão conta como produção,
// conforme a taxa aplicada (taxa = (maquineta − venda) / venda)
// ============================================

/** Faixas ordenadas da maior taxa para a menor; a primeira com minRatePct ≤ taxa vence. */
export const PRODUCTION_TIERS: { minRatePct: number; factor: number }[] = [
    { minRatePct: 20, factor: 1 }, // ≥ 20% → produção completa
    { minRatePct: 19, factor: 0.8 }, // 19% a 19,9% → 80%
    { minRatePct: 18, factor: 0.5 }, // 18% a 18,9% → 50%
    { minRatePct: 0, factor: 0.3 }, // abaixo de 18% → 30%
];

export function calcSaleFeeRatePct(saleValue: number, terminalAmount: number): number {
    if (saleValue <= 0) return 0;
    return ((terminalAmount - saleValue) / saleValue) * 100;
}

export function getProductionFactor(feeRatePct: number): number {
    const rate = Math.round(feeRatePct * 100) / 100;
    const tier = PRODUCTION_TIERS.find((t) => rate >= t.minRatePct);
    return tier?.factor ?? PRODUCTION_TIERS[PRODUCTION_TIERS.length - 1].factor;
}

/** Produção = valor da venda × fator da faixa. Ex: maquineta 1.190, venda 1.000 (19%) → 800. */
export function calcProductionValue(saleValue: number, terminalAmount: number): number {
    return saleValue * getProductionFactor(calcSaleFeeRatePct(saleValue, terminalAmount));
}

/** Payment methods that require account selection (PIX/TEC) */
export const PAYMENT_METHODS_REQUIRING_ACCOUNT: string[] = ['pix', 'tec', 'pix_especie'];
