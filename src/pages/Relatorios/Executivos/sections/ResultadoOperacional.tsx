import { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useBranchStore } from '@/stores';
import { getDREData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ResultadoOperacional() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['dre-gerencial', unidadeAtual?.id, dateRange],
        queryFn: () => getDREData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const handleExportPDF = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('DRE Gerencial', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(12);
        for (const item of data.items) {
            doc.text(item.account, 20, y);
            doc.text(formatCurrency(item.actual), pageWidth - 20, y, { align: 'right' });
            y += 10;
        }

        doc.save(`dre-gerencial-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.items.map(item => ({
            Conta: item.account,
            Previsto: item.planned,
            Realizado: item.actual,
            Variação: item.variance,
            'Variação %': item.variancePercent,
        })), `dre-gerencial-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data) return <EmptyState icon={FileText} message="Sem dados para o período" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Resultado Operacional (DRE Gerencial)</h2>
                    <p className="text-muted-foreground">
                        Demonstrativo de Resultados do Exercício - visão gerencial.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        className="input-financial"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-muted-foreground">até</span>
                    <input
                        type="date"
                        className="input-financial"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                    <button className="btn-secondary" onClick={handleExportPDF}>
                        <Printer className="w-4 h-4" />
                        PDF
                    </button>
                    <button className="btn-secondary" onClick={handleExportExcel}>
                        <Download className="w-4 h-4" />
                        Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Receita Bruta" value={formatCurrency(data.receita_bruta)} icon={FileText} variant="income" />
                <StatCard label="Receita Líquida" value={formatCurrency(data.receita_liquida)} icon={FileText} variant="income" />
                <StatCard label="Resultado Líquido" value={formatCurrency(data.resultado_liquido)} icon={FileText} variant={data.resultado_liquido >= 0 ? 'income' : 'expense'} />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Demonstrativo de Resultado</h3>
                <div className="space-y-3">
                    {data.items.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b border-border">
                            <span className="font-medium text-foreground">{item.account}</span>
                            <div className="text-right">
                                <span className="font-mono text-foreground">{formatCurrency(item.actual)}</span>
                                {item.variance !== 0 && (
                                    <span className={`ml-2 text-xs ${item.variance >= 0 ? 'text-income' : 'text-expense'}`}>
                                        ({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
