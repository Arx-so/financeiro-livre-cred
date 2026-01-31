import { useState } from 'react';
import { TrendingUp, TrendingDown, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getCrescimentoRetracaoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function CrescimentoRetracao() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['crescimento-retracao', unidadeAtual?.id, dateRange],
        queryFn: () => getCrescimentoRetracaoData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const crescimentoMedio = data && data.length > 0
        ? data.reduce((sum, d) => sum + d.crescimentoPercent, 0) / data.length
        : 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Crescimento ou Retração (%)', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Crescimento Médio: ${crescimentoMedio.toFixed(2)}%`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Período', 20, y);
        doc.text('Valor', 80, y);
        doc.text('Crescimento', 140, y);
        doc.text('Crescimento %', 200, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.periodo, 20, y);
            doc.text(formatCurrency(item.valor), 80, y);
            doc.text(formatCurrency(item.crescimento), 140, y);
            doc.text(`${item.crescimentoPercent >= 0 ? '+' : ''}${item.crescimentoPercent.toFixed(2)}%`, 200, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`crescimento-retracao-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Período: d.periodo,
            Valor: d.valor,
            Crescimento: d.crescimento,
            'Crescimento %': d.crescimentoPercent,
        })), `crescimento-retracao-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Crescimento ou Retração (%)</h2>
                    <p className="text-muted-foreground">
                        Análise de crescimento ou retração percentual.
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
                <EmptyState icon={TrendingUp} message="Sem dados para o período" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    label="Crescimento Médio" 
                    value={`${crescimentoMedio >= 0 ? '+' : ''}${crescimentoMedio.toFixed(2)}%`} 
                    icon={crescimentoMedio >= 0 ? TrendingUp : TrendingDown} 
                    variant={crescimentoMedio >= 0 ? 'income' : 'expense'} 
                />
                <StatCard 
                    label="Valor Total" 
                    value={formatCurrency(data.reduce((sum, d) => sum + d.valor, 0))} 
                    icon={TrendingUp} 
                    variant="income" 
                />
                <StatCard 
                    label="Crescimento Total" 
                    value={formatCurrency(data.reduce((sum, d) => sum + d.crescimento, 0))} 
                    icon={TrendingUp} 
                    variant="income" 
                />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Evolução do Crescimento</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} />
                            <Tooltip 
                                formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`} 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} 
                            />
                            <Line 
                                type="monotone" 
                                dataKey="crescimentoPercent" 
                                name="Crescimento %" 
                                stroke={crescimentoMedio >= 0 ? "hsl(var(--income))" : "hsl(var(--expense))"} 
                                strokeWidth={2} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Tabela Detalhada</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-2">Período</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-right p-2">Crescimento</th>
                                <th className="text-right p-2">Crescimento %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.periodo}</td>
                                    <td className="text-right p-2 font-mono">{formatCurrency(item.valor)}</td>
                                    <td className={`text-right p-2 font-mono ${item.crescimento >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(item.crescimento)}
                                    </td>
                                    <td className={`text-right p-2 font-mono ${item.crescimentoPercent >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {item.crescimentoPercent >= 0 ? '+' : ''}{item.crescimentoPercent.toFixed(2)}%
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
