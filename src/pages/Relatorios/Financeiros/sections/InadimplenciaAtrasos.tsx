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
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getInadimplenciaData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function InadimplenciaAtrasos() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const { data, isLoading } = useQuery({
        queryKey: ['inadimplencia', unidadeAtual?.id],
        queryFn: () => getInadimplenciaData(unidadeAtual!.id),
        enabled: !!unidadeAtual?.id,
    });

    const totalInadimplencia = data?.reduce((sum, d) => sum + d.valor, 0) || 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Inadimplência e Atrasos', pageWidth / 2, 20, { align: 'center' });
        doc.text(`Total: ${formatCurrency(totalInadimplencia)}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Cliente', 20, y);
        doc.text('Valor', 100, y);
        doc.text('Dias Atraso', 160, y);
        doc.text('Último Pagamento', 220, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.cliente, 20, y);
            doc.text(formatCurrency(item.valor), 100, y);
            doc.text(item.diasAtraso.toString(), 160, y);
            doc.text(item.ultimoPagamento, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`inadimplencia-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Cliente: d.cliente,
            Valor: d.valor,
            'Dias de Atraso': d.diasAtraso,
            'Último Pagamento': d.ultimoPagamento,
        })), `inadimplencia-${new Date().toISOString().split('T')[0]}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={TrendingDown} message="Sem inadimplência registrada" />;

    // Agrupar por faixa de dias
    const faixas = {
        '1-30': data.filter(d => d.diasAtraso >= 1 && d.diasAtraso <= 30).reduce((sum, d) => sum + d.valor, 0),
        '31-60': data.filter(d => d.diasAtraso >= 31 && d.diasAtraso <= 60).reduce((sum, d) => sum + d.valor, 0),
        '61-90': data.filter(d => d.diasAtraso >= 61 && d.diasAtraso <= 90).reduce((sum, d) => sum + d.valor, 0),
        '90+': data.filter(d => d.diasAtraso > 90).reduce((sum, d) => sum + d.valor, 0),
    };

    const chartData = [
        { faixa: '1-30 dias', valor: faixas['1-30'] },
        { faixa: '31-60 dias', valor: faixas['31-60'] },
        { faixa: '61-90 dias', valor: faixas['61-90'] },
        { faixa: 'Mais de 90 dias', valor: faixas['90+'] },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Inadimplência e Atrasos</h2>
                    <p className="text-muted-foreground">
                        Análise de inadimplência e atrasos de pagamento.
                    </p>
                </div>
                <div className="flex items-center gap-2">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Inadimplência" value={formatCurrency(totalInadimplencia)} icon={TrendingDown} variant="expense" />
                <StatCard label="1-30 dias" value={formatCurrency(faixas['1-30'])} icon={TrendingDown} variant="expense" />
                <StatCard label="31-60 dias" value={formatCurrency(faixas['31-60'])} icon={TrendingDown} variant="expense" />
                <StatCard label="61-90 dias" value={formatCurrency(faixas['61-90'])} icon={TrendingDown} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Inadimplência por Faixa de Dias</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="faixa" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="valor" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Clientes em Atraso</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-2">Cliente</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-right p-2">Dias Atraso</th>
                                <th className="text-right p-2">Último Pagamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.cliente}</td>
                                    <td className="text-right p-2 font-mono text-expense">{formatCurrency(item.valor)}</td>
                                    <td className="text-right p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            item.diasAtraso <= 30 ? 'bg-yellow-100 text-yellow-800' :
                                            item.diasAtraso <= 60 ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {item.diasAtraso} dias
                                        </span>
                                    </td>
                                    <td className="text-right p-2">{item.ultimoPagamento}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
