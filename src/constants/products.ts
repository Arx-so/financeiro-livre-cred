/** Tipo de Cliente Elegível (caixa de seleção) */
export const ELIGIBLE_CLIENT_TYPES = [
    { value: 'servidor_publico', label: 'Servidor público' },
    { value: 'aposentado', label: 'Aposentado' },
    { value: 'pensionista', label: 'Pensionista' },
    { value: 'beneficiario_programa_social', label: 'Beneficiário de programa social' },
    { value: 'pessoa_fisica_geral', label: 'Pessoa física geral' },
] as const;

/** Público-alvo (checklist) */
export const TARGET_AUDIENCE_OPTIONS = [
    { value: 'servidor_publico', label: 'Servidor público' },
    { value: 'aposentado', label: 'Aposentado' },
    { value: 'pensionista', label: 'Pensionista' },
    { value: 'beneficiario_programa_social', label: 'Beneficiário de programa social' },
    { value: 'pessoa_fisica_geral', label: 'Pessoa física geral' },
] as const;

/** Forma de cobrança */
export const BILLING_TYPES = [
    { value: 'parcela_fixa', label: 'Parcela fixa' },
    { value: 'desconto_folha', label: 'Desconto em folha' },
    { value: 'debito_conta', label: 'Débito em conta' },
    { value: 'fatura_cartao', label: 'Fatura de cartão' },
    { value: 'conta_energia', label: 'Conta de energia' },
] as const;

/** Tipo de comissão */
export const COMMISSION_TYPES = [
    { value: 'fixa', label: 'Fixa' },
    { value: 'percentual', label: 'Percentual' },
] as const;

/** Comissão recebida da instituição por */
export const COMMISSION_RECEIVED_BY_LABELS = {
    by_product: 'Por produto',
    by_term: 'Por prazo',
    by_value: 'Por valor liberado',
} as const;

/** Documentação exigida (checklist) */
export const REQUIRED_DOCS_OPTIONS = [
    { value: 'documento_pessoal', label: 'Documento pessoal' },
    { value: 'comprovante_renda', label: 'Comprovante de renda' },
    { value: 'extrato_beneficio', label: 'Extrato do benefício' },
    { value: 'extrato_fgts', label: 'Extrato FGTS' },
    { value: 'crlv', label: 'CRLV (veículo)' },
    { value: 'fatura_cartao', label: 'Fatura do cartão' },
    { value: 'conta_energia', label: 'Conta de energia' },
    { value: 'outros', label: 'Outros' },
] as const;

/** Exemplos de regras específicas por tipo de produto (labels para o campo) */
export const SPECIFIC_RULES_EXAMPLES: Record<string, string[]> = {
    Consignado: ['Margem mínima (%)', 'Órgãos conveniados'],
    FGTS: ['Percentual máximo de antecipação', 'Quantidade de parcelas antecipáveis'],
    'Carro como garantia': ['Ano mínimo do veículo', '% máximo sobre a FIPE'],
    'Cartão de crédito': ['Limite mínimo exigido', '% liberado do limite'],
    Energia: ['Concessionárias aceitas'],
};
