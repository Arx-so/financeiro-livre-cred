import { DollarSign, Download, Printer } from 'lucide-react';
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
import { getValorExpostoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ValorTotalExposto() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const { data, isLoading } = useQuery({
        queryKey: ['valor-exposto', unidadeAtual?.id],
        queryFn: () => getValorExpostoData(unidadeAtual!.id),
        enabled: !!unidadeAtual?.id,
    });

    const handleExportPDF = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Valor Total Exposto', pageWidth / 2, 20, { align: 'center' });
        doc.text(`Total: ${formatCurrency(data.total)}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Período', 20, y);
        doc.text('Valor', 100, y);
        y += 10;

        for (const item of data.porPeriodo) {
            doc.text(item.periodo, 20, y);
            doc.text(formatCurrency(item.valor), 100, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`valor-exposto-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.porPeriodo.map(d => ({
            Período: d.periodo,
            Valor: d.valor,
        })), `valor-exposto-${new Date().toISOString().split('T')[0]}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Valor Total Exposto</h2>
                    <p className="text-muted-foreground">
                        Valor total exposto em inadimplência.
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

            {isLoading && <LoadingState />}
            {!isLoading && !data && (
                <EmptyState icon={DollarSign} message="Sem dados disponíveis" />
            )}
            {!isLoading && data && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <StatCard label="Valor Total Exposto" value={formatCurrency(data.total)} icon={DollarSign} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Evolução por Período</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.porPeriodo}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="valor" name="Valor Exposto" stroke="hsl(var(--expense))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Detalhamento por Período</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-2">Período</th>
                                <th className="text-right p-2">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.porPeriodo.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.periodo}</td>
                                    <td className="text-right p-2 font-mono text-expense">{formatCurrency(item.valor)}</td>
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
