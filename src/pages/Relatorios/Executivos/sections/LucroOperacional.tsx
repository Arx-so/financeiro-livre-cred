import { useState } from 'react';
import { TrendingUp, Download, Printer } from 'lucide-react';
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
import { getLucroOperacionalData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function LucroOperacional() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['lucro-operacional', unidadeAtual?.id, dateRange],
        queryFn: () => getLucroOperacionalData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const lucroTotal = data?.reduce((sum, d) => sum + d.lucro, 0) || 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Lucro Operacional', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Lucro Total: ${formatCurrency(lucroTotal)}`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Data', 20, y);
        doc.text('Lucro', 80, y);
        doc.text('Receita', 140, y);
        doc.text('Despesas', 200, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.date, 20, y);
            doc.text(formatCurrency(item.lucro), 80, y);
            doc.text(formatCurrency(item.receita), 140, y);
            doc.text(formatCurrency(item.despesas), 200, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`lucro-operacional-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Data: d.date,
            Lucro: d.lucro,
            Receita: d.receita,
            Despesas: d.despesas,
        })), `lucro-operacional-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Lucro Operacional</h2>
                    <p className="text-muted-foreground">
                        Análise do lucro operacional do negócio.
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
                <StatCard label="Lucro Total" value={formatCurrency(lucroTotal)} icon={TrendingUp} variant={lucroTotal >= 0 ? 'income' : 'expense'} />
                <StatCard label="Receita Total" value={formatCurrency(data.reduce((sum, d) => sum + d.receita, 0))} icon={TrendingUp} variant="income" />
                <StatCard label="Despesas Totais" value={formatCurrency(data.reduce((sum, d) => sum + d.despesas, 0))} icon={TrendingUp} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Evolução do Lucro Operacional</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="lucro" name="Lucro Operacional" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
