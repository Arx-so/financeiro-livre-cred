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
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getMargemProdutoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function MargemProduto() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['margem-produto', unidadeAtual?.id, dateRange],
        queryFn: () => getMargemProdutoData(unidadeAtual!.id, dateRange.start, dateRange.end),
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
        doc.text('Margem por Produto', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Produto', 20, y);
        doc.text('Receita', 80, y);
        doc.text('Custo', 140, y);
        doc.text('Margem', 200, y);
        doc.text('Margem %', 260, y);
        y += 10;

        for (const item of data) {
            doc.text(item.produto, 20, y);
            doc.text(formatCurrency(item.receita), 80, y);
            doc.text(formatCurrency(item.custo), 140, y);
            doc.text(formatCurrency(item.margem), 200, y);
            doc.text(`${item.margemPercent.toFixed(2)}%`, 260, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`margem-produto-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Produto: d.produto,
            Receita: d.receita,
            Custo: d.custo,
            Margem: d.margem,
            'Margem %': d.margemPercent,
            Quantidade: d.quantidade,
        })), `margem-produto-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Margem por Produto</h2>
                    <p className="text-muted-foreground">
                        Análise de margem por produto (cartão, consignado, outros).
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
                <h3 className="font-semibold text-foreground mb-4">Margem por Produto</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="produto" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="receita" name="Receita" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="custo" name="Custo" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="margem" name="Margem" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                                <th className="text-left p-2">Produto</th>
                                <th className="text-right p-2">Receita</th>
                                <th className="text-right p-2">Custo</th>
                                <th className="text-right p-2">Margem</th>
                                <th className="text-right p-2">Margem %</th>
                                <th className="text-right p-2">Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.produto}</td>
                                    <td className="text-right p-2 font-mono">{formatCurrency(item.receita)}</td>
                                    <td className="text-right p-2 font-mono text-expense">{formatCurrency(item.custo)}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.margem)}</td>
                                    <td className="text-right p-2 font-mono">{item.margemPercent.toFixed(2)}%</td>
                                    <td className="text-right p-2">{item.quantidade}</td>
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
