import currency from 'currency.js';

// Brazilian Real currency configuration
const BRL = (value: number | string) => currency(value, {
    symbol: 'R$ ',
    separator: '.',
    decimal: ',',
    precision: 2,
});

/**
 * Format a number as Brazilian Real currency
 * @param value - The numeric value to format
 * @returns Formatted string like "R$ 1.234,56"
 */
export function formatCurrencyBRL(value: number | string): string {
    if (value === '' || value === null || value === undefined) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0 : value;
    return BRL(numValue).format();
}

/**
 * Parse a Brazilian Real formatted string back to a number
 * @param formatted - The formatted string like "R$ 1.234,56"
 * @returns The numeric value
 */
export function parseCurrencyBRL(formatted: string): number {
    if (!formatted) return 0;
    // Remove currency symbol, spaces, and dots (thousand separators)
    // Then replace comma with dot for decimal
    const cleaned = formatted
        .replace(/R\$\s?/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return parseFloat(cleaned) || 0;
}

/**
 * Format currency as user types (handles partial input)
 * @param value - Raw input value
 * @returns Formatted currency string
 */
export function formatCurrencyInput(value: string): string {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';

    // Convert to cents then to reais
    const cents = parseInt(digits, 10);
    const reais = cents / 100;

    return BRL(reais).format();
}

/**
 * Format Brazilian phone number
 * Mobile: (XX) 9XXXX-XXXX (11 digits)
 * Landline: (XX) XXXX-XXXX (10 digits)
 * @param value - Raw phone number digits
 * @returns Formatted phone string
 */
export function formatPhone(value: string): string {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
    // Landline format: (XX) XXXX-XXXX
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
    // Mobile format: (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Extract raw digits from formatted phone
 */
export function parsePhone(formatted: string): string {
    return formatted.replace(/\D/g, '');
}

/**
 * Format CPF: 000.000.000-00
 * @param value - Raw CPF digits
 * @returns Formatted CPF string
 */
export function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Format CNPJ: 00.000.000/0000-00
 * @param value - Raw CNPJ digits
 * @returns Formatted CNPJ string
 */
export function formatCNPJ(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14);

    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Format document (CPF or CNPJ) based on length
 * @param value - Raw document digits
 * @returns Formatted document string
 */
export function formatDocument(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length <= 11) {
        return formatCPF(value);
    }
    return formatCNPJ(value);
}

/**
 * Extract raw digits from formatted document
 */
export function parseDocument(formatted: string): string {
    return formatted.replace(/\D/g, '');
}

/**
 * Format CEP: 00000-000
 * @param value - Raw CEP digits
 * @returns Formatted CEP string
 */
export function formatCEP(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    if (digits.length === 0) return '';
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Extract raw digits from formatted CEP
 */
export function parseCEP(formatted: string): string {
    return formatted.replace(/\D/g, '');
}
