import { useState } from 'react';
import { Percent, Download, Printer } from 'lucide-react';
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
import { getMargemLiquidaContratoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function MargemLiquidaContrato() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['margem-liquida-contrato', unidadeAtual?.id, dateRange],
        queryFn: () => getMargemLiquidaContratoData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const margemMedia = data && data.length > 0
        ? data.reduce((sum, d) => sum + d.margemPercent, 0) / data.length
        : 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Margem Líquida por Contrato', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Margem Média: ${margemMedia.toFixed(2)}%`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Contrato', 20, y);
        doc.text('Receita', 80, y);
        doc.text('Custos', 140, y);
        doc.text('Margem', 200, y);
        doc.text('Margem %', 260, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.contrato.substring(0, 20), 20, y);
            doc.text(formatCurrency(item.receita), 80, y);
            doc.text(formatCurrency(item.custos), 140, y);
            doc.text(formatCurrency(item.margem), 200, y);
            doc.text(`${item.margemPercent.toFixed(2)}%`, 260, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`margem-liquida-contrato-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Contrato: d.contrato,
            Receita: d.receita,
            Custos: d.custos,
            Margem: d.margem,
            'Margem %': d.margemPercent,
        })), `margem-liquida-contrato-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={Percent} message="Sem dados para o período" />;

    const chartData = data.slice(0, 10).map(item => ({
        contrato: item.contrato.substring(0, 15),
        margem: item.margem,
        margemPercent: item.margemPercent,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Margem Líquida por Contrato</h2>
                    <p className="text-muted-foreground">
                        Análise da margem líquida por contrato.
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

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Top 10 Contratos por Margem</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="contrato" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="margem" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
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
                                <th className="text-left p-2">Contrato</th>
                                <th className="text-right p-2">Receita</th>
                                <th className="text-right p-2">Custos</th>
                                <th className="text-right p-2">Margem</th>
                                <th className="text-right p-2">Margem %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.contrato}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.receita)}</td>
                                    <td className="text-right p-2 font-mono text-expense">{formatCurrency(item.custos)}</td>
                                    <td className={`text-right p-2 font-mono ${item.margem >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(item.margem)}
                                    </td>
                                    <td className={`text-right p-2 font-mono ${item.margemPercent >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {item.margemPercent.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
