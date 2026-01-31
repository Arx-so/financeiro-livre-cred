import { useState } from 'react';
import { Target, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getScorePerformanceVendedorData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ScorePerformanceVendedor() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['score-performance-vendedor', unidadeAtual?.id, dateRange],
        queryFn: () => getScorePerformanceVendedorData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Score de Performance do Vendedor', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Vendedor', 20, y);
        doc.text('Score', 100, y);
        doc.text('Vendas', 140, y);
        doc.text('Metas', 180, y);
        doc.text('Eficiência', 220, y);
        y += 10;

        for (const item of data) {
            doc.text(item.vendedor, 20, y);
            doc.text(item.score.toFixed(2), 100, y);
            doc.text(formatCurrency(item.vendas), 140, y);
            doc.text(formatCurrency(item.metas), 180, y);
            doc.text(`${item.eficiencia.toFixed(2)}%`, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`score-performance-vendedor-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Vendedor: d.vendedor,
            Score: d.score,
            Vendas: d.vendas,
            Metas: d.metas,
            Eficiência: d.eficiencia,
        })), `score-performance-vendedor-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Score de Performance do Vendedor</h2>
                    <p className="text-muted-foreground">
                        Análise do score de performance de cada vendedor.
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

            {isLoading && <LoadingState />}
            {!isLoading && (!data || data.length === 0) && (
                <EmptyState icon={Target} message="Sem dados para o período" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Score de Performance</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="vendedor" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip formatter={(value: number) => value.toFixed(2)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Tabela Detalhada</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-2">Vendedor</th>
                                <th className="text-right p-2">Score</th>
                                <th className="text-right p-2">Vendas</th>
                                <th className="text-right p-2">Metas</th>
                                <th className="text-right p-2">Eficiência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.vendedor}</td>
                                    <td className="text-right p-2 font-mono font-bold">{item.score.toFixed(2)}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.vendas)}</td>
                                    <td className="text-right p-2 font-mono">{formatCurrency(item.metas)}</td>
                                    <td className={`text-right p-2 font-mono ${item.eficiencia >= 100 ? 'text-income' : 'text-expense'}`}>
                                        {item.eficiencia.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
