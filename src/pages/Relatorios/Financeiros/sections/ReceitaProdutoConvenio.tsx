import { useState } from 'react';
import { DollarSign, Download, Printer } from 'lucide-react';
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
import { getReceitaProdutoConvenioData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ReceitaProdutoConvenio() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['receita-produto-convenio', unidadeAtual?.id, dateRange],
        queryFn: () => getReceitaProdutoConvenioData(unidadeAtual!.id, dateRange.start, dateRange.end),
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
        doc.text('Receita por Produto e Convênio', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Produto', 20, y);
        doc.text('Convênio', 80, y);
        doc.text('Receita', 140, y);
        doc.text('Quantidade', 200, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.produto, 20, y);
            doc.text(item.convenio, 80, y);
            doc.text(formatCurrency(item.receita), 140, y);
            doc.text(item.quantidade.toString(), 200, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`receita-produto-convenio-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Produto: d.produto,
            Convênio: d.convenio,
            Receita: d.receita,
            Quantidade: d.quantidade,
        })), `receita-produto-convenio-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    const produtoData = new Map<string, number>();
    if (data) for (const item of data) {
        produtoData.set(item.produto, (produtoData.get(item.produto) || 0) + item.receita);
    }
    const chartData = data ? Array.from(produtoData.entries()).map(([produto, receita]) => ({ produto, receita })).sort((a, b) => b.receita - a.receita).slice(0, 10) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Receita por Produto e Convênio</h2>
                    <p className="text-muted-foreground">
                        Análise de receita por produto e convênio.
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
                <EmptyState icon={DollarSign} message="Sem dados para o período" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Receita por Produto</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="produto" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="receita" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
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
                                <th className="text-left p-2">Convênio</th>
                                <th className="text-right p-2">Receita</th>
                                <th className="text-right p-2">Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.produto}</td>
                                    <td className="p-2">{item.convenio}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.receita)}</td>
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
