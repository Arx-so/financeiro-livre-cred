/**
 * Validate Brazilian CPF (Cadastro de Pessoas Físicas)
 * Uses the modulo 11 algorithm with check digits
 * @param cpf - CPF string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
    // Remove non-digits
    const digits = cpf.replace(/\D/g, '');

    // Must have exactly 11 digits
    if (digits.length !== 11) return false;

    // Check for known invalid patterns (all same digits)
    if (/^(\d)\1{10}$/.test(digits)) return false;

    // Calculate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i], 10) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[9], 10)) return false;

    // Calculate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(digits[i], 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[10], 10)) return false;

    return true;
}

/**
 * Validate Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * Uses the modulo 11 algorithm with check digits
 * @param cnpj - CNPJ string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function validateCNPJ(cnpj: string): boolean {
    // Remove non-digits
    const digits = cnpj.replace(/\D/g, '');

    // Must have exactly 14 digits
    if (digits.length !== 14) return false;

    // Check for known invalid patterns (all same digits)
    if (/^(\d)\1{13}$/.test(digits)) return false;

    // Calculate first check digit
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(digits[i], 10) * weights1[i];
    }
    let remainder = sum % 11;
    const firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;
    if (firstCheckDigit !== parseInt(digits[12], 10)) return false;

    // Calculate second check digit
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(digits[i], 10) * weights2[i];
    }
    remainder = sum % 11;
    const secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;
    if (secondCheckDigit !== parseInt(digits[13], 10)) return false;

    return true;
}

/**
 * Auto-detect document type and validate
 * @param document - Document string (CPF or CNPJ, with or without formatting)
 * @returns Object with isValid and type
 */
export function validateDocument(document: string): { isValid: boolean; type: 'cpf' | 'cnpj' | 'unknown' } {
    const digits = document.replace(/\D/g, '');

    if (digits.length === 11) {
        return { isValid: validateCPF(digits), type: 'cpf' };
    }

    if (digits.length === 14) {
        return { isValid: validateCNPJ(digits), type: 'cnpj' };
    }

    return { isValid: false, type: 'unknown' };
}

/**
 * Check if a document is valid (CPF or CNPJ)
 * @param document - Document string
 * @returns true if valid CPF or CNPJ
 */
export function isValidDocument(document: string): boolean {
    return validateDocument(document).isValid;
}

/**
 * Get document type based on length
 * @param document - Document string
 * @returns 'cpf', 'cnpj', or 'unknown'
 */
export function getDocumentType(document: string): 'cpf' | 'cnpj' | 'unknown' {
    const digits = document.replace(/\D/g, '');
    if (digits.length <= 11) return 'cpf';
    if (digits.length <= 14) return 'cnpj';
    return 'unknown';
}
