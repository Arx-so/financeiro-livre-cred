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
import { getComissoesReportData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function RelatorioComissoes() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });
    const [filtro, setFiltro] = useState<'vendedor' | 'produto' | 'periodo'>('vendedor');

    const { data, isLoading } = useQuery({
        queryKey: ['relatorio-comissoes', unidadeAtual?.id, dateRange, filtro],
        queryFn: () => getComissoesReportData(
            unidadeAtual!.id,
            dateRange.start,
            dateRange.end,
            filtro === 'vendedor' ? { vendedor: undefined } : filtro === 'produto' ? { produto: undefined } : undefined
        ),
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
        doc.text(`Filtro: Por ${filtro}`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text(filtro === 'vendedor' ? 'Vendedor' : filtro === 'produto' ? 'Produto' : 'Período', 20, y);
        doc.text('Valor', 100, y);
        doc.text('Quantidade', 160, y);
        doc.text('%', 220, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            const key = item.vendedor || item.produto || item.periodo || '';
            doc.text(key, 20, y);
            doc.text(formatCurrency(item.valor), 100, y);
            doc.text(item.quantidade.toString(), 160, y);
            doc.text(`${item.percentual.toFixed(2)}%`, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`relatorio-comissoes-${filtro}-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            [filtro === 'vendedor' ? 'Vendedor' : filtro === 'produto' ? 'Produto' : 'Período']: d.vendedor || d.produto || d.periodo || '',
            Valor: d.valor,
            Quantidade: d.quantidade,
            Percentual: d.percentual,
        })), `relatorio-comissoes-${filtro}-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={DollarSign} message="Sem dados para o período" />;

    const chartData = data.map(item => ({
        name: item.vendedor || item.produto || item.periodo || '',
        valor: item.valor,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Relatório de Comissões</h2>
                    <p className="text-muted-foreground">
                        Relatório detalhado de comissões por vendedor, produto e período.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input-financial"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value as 'vendedor' | 'produto' | 'periodo')}
                    >
                        <option value="vendedor">Por Vendedor</option>
                        <option value="produto">Por Produto</option>
                        <option value="periodo">Por Período</option>
                    </select>
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
                <h3 className="font-semibold text-foreground mb-4">Comissões por {filtro === 'vendedor' ? 'Vendedor' : filtro === 'produto' ? 'Produto' : 'Período'}</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
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
                                <th className="text-left p-2">{filtro === 'vendedor' ? 'Vendedor' : filtro === 'produto' ? 'Produto' : 'Período'}</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-right p-2">Quantidade</th>
                                <th className="text-right p-2">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.vendedor || item.produto || item.periodo || ''}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.valor)}</td>
                                    <td className="text-right p-2">{item.quantidade}</td>
                                    <td className="text-right p-2">{item.percentual.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
