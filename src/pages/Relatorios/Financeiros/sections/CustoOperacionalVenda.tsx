import { useState } from 'react';
import { Percent, Download, Printer } from 'lucide-react';
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
import { getCustoOperacionalVendaData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function CustoOperacionalVenda() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['custo-operacional-venda', unidadeAtual?.id, dateRange],
        queryFn: () => getCustoOperacionalVendaData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const custoMedio = data && data.length > 0
        ? data.reduce((sum, d) => sum + d.custoOperacional, 0) / data.length
        : 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Custo Operacional por Venda', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Custo Médio: ${formatCurrency(custoMedio)}`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Venda', 20, y);
        doc.text('Custo Operacional', 100, y);
        doc.text('Receita', 160, y);
        doc.text('Margem', 220, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.venda, 20, y);
            doc.text(formatCurrency(item.custoOperacional), 100, y);
            doc.text(formatCurrency(item.receita), 160, y);
            doc.text(formatCurrency(item.margem), 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`custo-operacional-venda-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Venda: d.venda,
            'Custo Operacional': d.custoOperacional,
            Receita: d.receita,
            Margem: d.margem,
        })), `custo-operacional-venda-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Custo Operacional por Venda</h2>
                    <p className="text-muted-foreground">
                        Análise do custo operacional por venda.
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
                <EmptyState icon={Percent} message="Sem dados para o período" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Custo Operacional por Venda</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.slice(0, 20)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="venda" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="custoOperacional" name="Custo Operacional" stroke="hsl(var(--expense))" strokeWidth={2} />
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
                                <th className="text-left p-2">Venda</th>
                                <th className="text-right p-2">Custo Operacional</th>
                                <th className="text-right p-2">Receita</th>
                                <th className="text-right p-2">Margem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.venda}</td>
                                    <td className="text-right p-2 font-mono text-expense">{formatCurrency(item.custoOperacional)}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.receita)}</td>
                                    <td className={`text-right p-2 font-mono ${item.margem >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(item.margem)}
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
