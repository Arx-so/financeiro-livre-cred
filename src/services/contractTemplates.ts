import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';
import type {
    ContractTemplate,
    ContractTemplateInsert,
    ContractTemplateUpdate,
    Favorecido,
} from '@/types/database';

export interface ContractTemplateFilters {
    search?: string;
    isActive?: boolean;
}

// Variáveis suportadas no template
export const TEMPLATE_VARIABLES = [
    { key: '{{nome}}', label: 'Nome do Cliente', description: 'Nome completo do favorecido' },
    { key: '{{documento}}', label: 'Documento', description: 'CPF/CNPJ do favorecido' },
    { key: '{{endereco}}', label: 'Endereço', description: 'Endereço completo' },
    { key: '{{cidade}}', label: 'Cidade', description: 'Cidade do favorecido' },
    { key: '{{estado}}', label: 'Estado', description: 'UF do favorecido' },
    { key: '{{cep}}', label: 'CEP', description: 'CEP do favorecido' },
    { key: '{{telefone}}', label: 'Telefone', description: 'Telefone do favorecido' },
    { key: '{{email}}', label: 'E-mail', description: 'E-mail do favorecido' },
    { key: '{{data}}', label: 'Data', description: 'Data atual formatada' },
    { key: '{{valor}}', label: 'Valor', description: 'Valor do contrato em R$' },
    { key: '{{valor_extenso}}', label: 'Valor por Extenso', description: 'Valor do contrato por extenso' },
];

/**
 * Busca todos os templates com filtros
 */
export async function getTemplates(filters: ContractTemplateFilters = {}): Promise<ContractTemplate[]> {
    let query = supabase
        .from('contract_templates')
        .select('*')
        .order('name', { ascending: true });

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Busca um template pelo ID
 */
export async function getTemplate(id: string): Promise<ContractTemplate | null> {
    const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching template:', error);
        throw error;
    }

    return data;
}

/**
 * Cria um novo template
 */
export async function createTemplate(template: ContractTemplateInsert): Promise<ContractTemplate> {
    const { data, error } = await supabase
        .from('contract_templates')
        .insert(template)
        .select()
        .single();

    if (error) {
        console.error('Error creating template:', error);
        throw error;
    }

    return data;
}

/**
 * Atualiza um template existente
 */
export async function updateTemplate(id: string, template: ContractTemplateUpdate): Promise<ContractTemplate> {
    const { data, error } = await supabase
        .from('contract_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating template:', error);
        throw error;
    }

    return data;
}

/**
 * Deleta um template
 */
export async function deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
}

/**
 * Converte número para valor por extenso em português
 */
function numberToWords(num: number): string {
    if (num === 0) return 'zero reais';

    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    const convertHundreds = (n: number): string => {
        if (n === 0) return '';
        if (n === 100) return 'cem';
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) {
            const t = Math.floor(n / 10);
            const u = n % 10;
            return tens[t] + (u > 0 ? ` e ${units[u]}` : '');
        }
        const h = Math.floor(n / 100);
        const rest = n % 100;
        return hundreds[h] + (rest > 0 ? ` e ${convertHundreds(rest)}` : '');
    };

    const intPart = Math.floor(num);
    const cents = Math.round((num - intPart) * 100);

    let result = '';

    if (intPart >= 1000000) {
        const millions = Math.floor(intPart / 1000000);
        result += (millions === 1 ? 'um milhão' : `${convertHundreds(millions)} milhões`);
        const rest = intPart % 1000000;
        if (rest > 0) {
            result += (rest < 1000 ? ' e ' : ' ') + convertThousands(rest);
        }
    } else {
        result = convertThousands(intPart);
    }

    function convertThousands(n: number): string {
        if (n === 0) return '';
        if (n < 1000) return convertHundreds(n);
        const thousands = Math.floor(n / 1000);
        const rest = n % 1000;
        const thousandsPart = thousands === 1 ? 'mil' : `${convertHundreds(thousands)} mil`;
        return thousandsPart + (rest > 0 ? (rest < 100 ? ' e ' : ' ') + convertHundreds(rest) : '');
    }

    result += intPart === 1 ? ' real' : ' reais';

    if (cents > 0) {
        result += ` e ${convertHundreds(cents)}${cents === 1 ? ' centavo' : ' centavos'}`;
    }

    return result;
}

/**
 * Substitui as variáveis do template pelos dados reais
 */
export function replaceTemplateVariables(
    content: string,
    favorecido: Favorecido | null,
    contractData?: { value?: number; date?: string }
): string {
    let result = content;

    // Dados do favorecido
    if (favorecido) {
        result = result.replace(/\{\{nome\}\}/g, favorecido.name || '');
        result = result.replace(/\{\{documento\}\}/g, favorecido.document || '');
        result = result.replace(/\{\{endereco\}\}/g, favorecido.address || '');
        result = result.replace(/\{\{cidade\}\}/g, favorecido.city || '');
        result = result.replace(/\{\{estado\}\}/g, favorecido.state || '');
        result = result.replace(/\{\{cep\}\}/g, favorecido.zip_code || '');
        result = result.replace(/\{\{telefone\}\}/g, favorecido.phone || '');
        result = result.replace(/\{\{email\}\}/g, favorecido.email || '');
    } else {
        // Limpar variáveis de favorecido se não houver dados
        result = result.replace(/\{\{nome\}\}/g, '_______________');
        result = result.replace(/\{\{documento\}\}/g, '_______________');
        result = result.replace(/\{\{endereco\}\}/g, '_______________');
        result = result.replace(/\{\{cidade\}\}/g, '_______________');
        result = result.replace(/\{\{estado\}\}/g, '_______________');
        result = result.replace(/\{\{cep\}\}/g, '_______________');
        result = result.replace(/\{\{telefone\}\}/g, '_______________');
        result = result.replace(/\{\{email\}\}/g, '_______________');
    }

    // Data
    const date = contractData?.date ? new Date(contractData.date) : new Date();
    const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
    result = result.replace(/\{\{data\}\}/g, formattedDate);

    // Valor
    if (contractData?.value !== undefined) {
        const formattedValue = contractData.value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
        result = result.replace(/\{\{valor\}\}/g, formattedValue);
        result = result.replace(/\{\{valor_extenso\}\}/g, numberToWords(contractData.value));
    } else {
        result = result.replace(/\{\{valor\}\}/g, 'R$ _______________');
        result = result.replace(/\{\{valor_extenso\}\}/g, '_______________');
    }

    return result;
}

export type ExportContractPdfMode = 'download' | 'print';

/**
 * Gera um PDF a partir do conteúdo do contrato.
 * mode 'download': baixa o arquivo; mode 'print': abre o mesmo PDF em nova aba e dispara a impressão.
 */
export function exportContractToPDF(
    content: string,
    title: string = 'Contrato',
    mode: ExportContractPdfMode = 'download'
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, maxWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * 8 + 10;

    // Conteúdo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const lines = content.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Verificar se é um título de seção (texto em maiúsculas)
        const isSection = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 0 && !/^\d/.test(trimmedLine);

        if (isSection) {
            doc.setFont('helvetica', 'bold');
            y += 5;
        } else {
            doc.setFont('helvetica', 'normal');
        }

        const wrappedLines = doc.splitTextToSize(trimmedLine || ' ', maxWidth);

        for (const wrappedLine of wrappedLines) {
            // Verificar se precisa de nova página
            if (y + 7 > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            doc.text(wrappedLine, margin, y);
            y += 6;
        }

        // Espaço extra entre parágrafos
        if (trimmedLine === '') {
            y += 3;
        }
    }

    if (mode === 'print') {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            setTimeout(() => {
                try {
                    printWindow.print();
                } finally {
                    URL.revokeObjectURL(url);
                }
            }, 600);
        }
        return;
    }

    // Download do PDF
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

/**
 * Gera contrato a partir de um template
 */
export async function generateContractFromTemplate(
    templateId: string,
    favorecidoId: string | null,
    contractData?: { value?: number; date?: string }
): Promise<string> {
    // Buscar template
    const template = await getTemplate(templateId);
    if (!template) {
        throw new Error('Template não encontrado');
    }

    // Buscar favorecido se fornecido
    let favorecido: Favorecido | null = null;
    if (favorecidoId) {
        const { data, error } = await supabase
            .from('favorecidos')
            .select('*')
            .eq('id', favorecidoId)
            .single();

        if (!error && data) {
            favorecido = data;
        }
    }

    // Substituir variáveis
    const generatedContent = replaceTemplateVariables(template.content, favorecido, contractData);

    return generatedContent;
}
