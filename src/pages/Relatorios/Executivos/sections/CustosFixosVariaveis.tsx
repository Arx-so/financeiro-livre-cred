import { useState } from 'react';
import { TrendingDown, Download, Printer } from 'lucide-react';
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
import { getCustosFixosVariaveisData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function CustosFixosVariaveis() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['custos-fixos-variaveis', unidadeAtual?.id, dateRange],
        queryFn: () => getCustosFixosVariaveisData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const custosFixos = data?.filter(c => c.tipo === 'fixo') || [];
    const custosVariaveis = data?.filter(c => c.tipo === 'variavel') || [];
    const totalFixos = custosFixos.reduce((sum, c) => sum + c.valor, 0);
    const totalVariaveis = custosVariaveis.reduce((sum, c) => sum + c.valor, 0);

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Custos Fixos e Variáveis', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Tipo', 20, y);
        doc.text('Categoria', 80, y);
        doc.text('Valor', 160, y);
        doc.text('%', 220, y);
        y += 10;

        for (const item of data) {
            doc.text(item.tipo === 'fixo' ? 'Fixo' : 'Variável', 20, y);
            doc.text(item.categoria, 80, y);
            doc.text(formatCurrency(item.valor), 160, y);
            doc.text(`${item.percentual.toFixed(2)}%`, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`custos-fixos-variaveis-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Tipo: d.tipo === 'fixo' ? 'Fixo' : 'Variável',
            Categoria: d.categoria,
            Valor: d.valor,
            Percentual: d.percentual,
        })), `custos-fixos-variaveis-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={TrendingDown} message="Sem dados para o período" />;

    const chartData = [
        { name: 'Custos Fixos', valor: totalFixos },
        { name: 'Custos Variáveis', valor: totalVariaveis },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Custos Fixos e Variáveis</h2>
                    <p className="text-muted-foreground">
                        Análise detalhada de custos fixos e variáveis.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard label="Total Custos Fixos" value={formatCurrency(totalFixos)} icon={TrendingDown} variant="expense" />
                <StatCard label="Total Custos Variáveis" value={formatCurrency(totalVariaveis)} icon={TrendingDown} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Comparativo Fixos vs Variáveis</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="valor" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Detalhamento por Categoria</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-2">Tipo</th>
                                <th className="text-left p-2">Categoria</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-right p-2">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${item.tipo === 'fixo' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.tipo === 'fixo' ? 'Fixo' : 'Variável'}
                                        </span>
                                    </td>
                                    <td className="p-2">{item.categoria}</td>
                                    <td className="text-right p-2 font-mono text-expense">{formatCurrency(item.valor)}</td>
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
