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

/** Payment methods that require account selection (PIX/TEC) */
export const PAYMENT_METHODS_REQUIRING_ACCOUNT: string[] = ['pix', 'tec', 'pix_especie'];
