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
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getComissoesData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function Comissoes() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['comissoes', unidadeAtual?.id, dateRange],
        queryFn: () => getComissoesData(unidadeAtual!.id, dateRange.start, dateRange.end),
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
        doc.text('Relatório de Comissões', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Vendedor', 20, y);
        doc.text('Valor', 100, y);
        doc.text('Quantidade', 160, y);
        doc.text('%', 220, y);
        y += 10;

        for (const item of data) {
            doc.text(item.vendedor, 20, y);
            doc.text(formatCurrency(item.valor), 100, y);
            doc.text(item.quantidade.toString(), 160, y);
            doc.text(`${item.percentual.toFixed(2)}%`, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`comissoes-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Vendedor: d.vendedor,
            Valor: d.valor,
            Quantidade: d.quantidade,
            Percentual: d.percentual,
        })), `comissoes-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Comissões</h2>
                    <p className="text-muted-foreground">
                        Análise de comissões pagas.
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
                <h3 className="font-semibold text-foreground mb-4">Comissões por Vendedor</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="vendedor" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="valor" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
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
                                <th className="text-right p-2">Valor</th>
                                <th className="text-right p-2">Quantidade</th>
                                <th className="text-right p-2">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.vendedor}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.valor)}</td>
                                    <td className="text-right p-2">{item.quantidade}</td>
                                    <td className="text-right p-2">{item.percentual.toFixed(2)}%</td>
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
