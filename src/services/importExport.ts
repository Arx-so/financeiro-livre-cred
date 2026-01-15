import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================
// IMPORT UTILITIES
// ============================================

export interface ParsedRow {
  [key: string]: string | number | null;
}

// Parse CSV file
export async function parseCSV(file: File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data as ParsedRow[]);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}

// Parse XLS/XLSX file
export async function parseExcel(file: File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(sheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsBinaryString(file);
    });
}

// Parse bank statement (generic format)
export interface BankStatementRow {
  date: string;
  description: string;
  value: number;
  type: 'credito' | 'debito';
  balance?: number;
  reference?: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  value: string;
  type?: string;
  balance?: string;
  reference?: string;
}

export function parseBankStatement(
    rows: ParsedRow[],
    mapping: ColumnMapping
): BankStatementRow[] {
    return rows.map((row) => {
        const value = parseFloat(String(row[mapping.value] || 0).replace(/[^\d,-]/g, '').replace(',', '.'));

        let type: 'credito' | 'debito' = 'debito';
        if (mapping.type && row[mapping.type]) {
            type = String(row[mapping.type]).toLowerCase().includes('c') ? 'credito' : 'debito';
        } else {
            type = value >= 0 ? 'credito' : 'debito';
        }

        // Parse date
        let date = String(row[mapping.date] || '');
        // Try to convert common date formats to ISO
        if (date.includes('/')) {
            const parts = date.split('/');
            if (parts.length === 3) {
                // Assume DD/MM/YYYY format
                date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        return {
            date,
            description: String(row[mapping.description] || '').trim(),
            value: Math.abs(value),
            type,
            balance: mapping.balance ? parseFloat(String(row[mapping.balance] || 0).replace(/[^\d,-]/g, '').replace(',', '.')) : undefined,
            reference: mapping.reference ? String(row[mapping.reference] || '').trim() : undefined,
        };
    }).filter((row) => row.date && row.description && row.value > 0);
}

// Parse XML (for fiscal documents like NF-e)
export async function parseXML(file: File): Promise<Document> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');

                const parseError = xmlDoc.getElementsByTagName('parsererror');
                if (parseError.length > 0) {
                    reject(new Error('Invalid XML file'));
                    return;
                }

                resolve(xmlDoc);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Parse NF-e XML
export interface NFEData {
  numero: string;
  serie: string;
  dataEmissao: string;
  emitente: {
    cnpj: string;
    nome: string;
  };
  destinatario: {
    cnpj: string;
    nome: string;
  };
  valorTotal: number;
  items: {
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }[];
}

export function parseNFE(xmlDoc: Document): NFEData | null {
    try {
        const nfe = xmlDoc.getElementsByTagName('NFe')[0] || xmlDoc.getElementsByTagName('nfeProc')[0];
        if (!nfe) return null;

        const infNFe = nfe.getElementsByTagName('infNFe')[0];
        if (!infNFe) return null;

        const ide = infNFe.getElementsByTagName('ide')[0];
        const emit = infNFe.getElementsByTagName('emit')[0];
        const dest = infNFe.getElementsByTagName('dest')[0];
        const total = infNFe.getElementsByTagName('total')[0];
        const dets = infNFe.getElementsByTagName('det');

        const getTextContent = (parent: Element | undefined, tagName: string): string => parent?.getElementsByTagName(tagName)[0]?.textContent || '';

        const items: NFEData['items'] = [];
        for (let i = 0; i < dets.length; i++) {
            const det = dets[i];
            const prod = det.getElementsByTagName('prod')[0];
            if (prod) {
                items.push({
                    descricao: getTextContent(prod, 'xProd'),
                    quantidade: parseFloat(getTextContent(prod, 'qCom')) || 0,
                    valorUnitario: parseFloat(getTextContent(prod, 'vUnCom')) || 0,
                    valorTotal: parseFloat(getTextContent(prod, 'vProd')) || 0,
                });
            }
        }

        return {
            numero: getTextContent(ide, 'nNF'),
            serie: getTextContent(ide, 'serie'),
            dataEmissao: getTextContent(ide, 'dhEmi').split('T')[0],
            emitente: {
                cnpj: getTextContent(emit, 'CNPJ'),
                nome: getTextContent(emit, 'xNome'),
            },
            destinatario: {
                cnpj: getTextContent(dest, 'CNPJ'),
                nome: getTextContent(dest, 'xNome'),
            },
            valorTotal: parseFloat(getTextContent(total?.getElementsByTagName('ICMSTot')[0], 'vNF')) || 0,
            items,
        };
    } catch (error) {
        console.error('Error parsing NF-e:', error);
        return null;
    }
}

// ============================================
// EXPORT UTILITIES
// ============================================

// Export data to CSV
export function exportToCSV(data: Record<string, any>[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

// Export data to Excel
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Dados'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export to PDF
export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: PDFTableColumn[];
  data: Record<string, any>[];
  orientation?: 'portrait' | 'landscape';
  footer?: string;
}

export function exportToPDF(options: PDFExportOptions): void {
    const {
        title, subtitle, columns, data, orientation = 'portrait', footer
    } = options;

    const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
    });

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Subtitle
    if (subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(subtitle, 14, 28);
    }

    // Table
    autoTable(doc, {
        startY: subtitle ? 35 : 30,
        head: [columns.map((col) => col.header)],
        body: data.map((row) => columns.map((col) => row[col.dataKey] ?? '')),
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontSize: 10,
        },
        bodyStyles: {
            fontSize: 9,
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250],
        },
        margin: { top: 35 },
    });

    // Footer
    if (footer) {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(footer, 14, doc.internal.pageSize.height - 10);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        }
    }

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

// Generate PDF report
export function generateReport(
    title: string,
    sections: {
    title: string;
    content: string | { columns: PDFTableColumn[]; data: Record<string, any>[] };
  }[]
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    let currentY = 20;

    // Main title
    doc.setFontSize(20);
    doc.text(title, 14, currentY);
    currentY += 15;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, currentY);
    currentY += 15;

    // Sections
    for (const section of sections) {
    // Check if need new page
        if (currentY > doc.internal.pageSize.height - 40) {
            doc.addPage();
            currentY = 20;
        }

        // Section title
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(section.title, 14, currentY);
        currentY += 8;

        if (typeof section.content === 'string') {
            // Text content
            doc.setFontSize(10);
            doc.setTextColor(60);
            const lines = doc.splitTextToSize(section.content, doc.internal.pageSize.width - 28);
            doc.text(lines, 14, currentY);
            currentY += lines.length * 5 + 10;
        } else {
            // Table content
            autoTable(doc, {
                startY: currentY,
                head: [section.content.columns.map((col) => col.header)],
                body: section.content.data.map((row) => section.content.columns.map((col) => row[col.dataKey] ?? '')),
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontSize: 9,
                },
                bodyStyles: {
                    fontSize: 8,
                },
                margin: { left: 14, right: 14 },
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

// Helper function to download blob
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Format currency for export
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

// Format date for export
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}
