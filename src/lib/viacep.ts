export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string;
}

/**
 * Fetch address data from ViaCEP API
 * @param cep - CEP string (8 digits, with or without formatting)
 * @returns Address data or null if not found
 */
export async function fetchAddress(cep: string): Promise<AddressData | null> {
    // Remove non-digits and validate length
    const digits = cep.replace(/\D/g, '');

    if (digits.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

        if (!response.ok) {
            throw new Error('Erro ao consultar CEP');
        }

        const data: ViaCEPResponse = await response.json();

        if (data.erro) {
            return null; // CEP not found
        }

        return {
            logradouro: data.logradouro,
            bairro: data.bairro,
            localidade: data.localidade,
            uf: data.uf,
            complemento: data.complemento || undefined,
        };
    } catch (error) {
        if (error instanceof Error && error.message === 'CEP deve ter 8 dígitos') {
            throw error;
        }
        throw new Error('Erro de conexão ao consultar CEP');
    }
}

/**
 * Check if a CEP is complete (8 digits)
 */
export function isCEPComplete(cep: string): boolean {
    return cep.replace(/\D/g, '').length === 8;
}
