import { useState } from 'react';
import { Calendar, Download, Printer } from 'lucide-react';
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
import { getAgingReport } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function Aging() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');

    const { data, isLoading } = useQuery({
        queryKey: ['aging', unidadeAtual?.id, tipo],
        queryFn: () => getAgingReport(unidadeAtual!.id, tipo),
        enabled: !!unidadeAtual?.id,
    });

    const total = data?.reduce((sum, d) => sum + d.total, 0) || 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text(`Aging - Contas a ${tipo === 'receita' ? 'Receber' : 'Pagar'}`, pageWidth / 2, 20, { align: 'center' });
        doc.text(`Total: ${formatCurrency(total)}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Faixa', 20, y);
        doc.text('Valor', 100, y);
        y += 10;

        for (const item of data) {
            doc.text(item.range, 20, y);
            doc.text(formatCurrency(item.total), 100, y);
            y += 8;
        }

        doc.save(`aging-${tipo}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Faixa: d.range,
            Valor: d.total,
        })), `aging-${tipo}-${new Date().toISOString().split('T')[0]}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Aging (30, 60, 90 dias)</h2>
                    <p className="text-muted-foreground">
                        Análise de aging de contas a receber e pagar.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input-financial"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as 'receita' | 'despesa')}
                    >
                        <option value="receita">A Receber</option>
                        <option value="despesa">A Pagar</option>
                    </select>
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
                <EmptyState icon={Calendar} message="Sem valores pendentes" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <StatCard label={`Total ${tipo === 'receita' ? 'a Receber' : 'a Pagar'}`} value={formatCurrency(total)} icon={Calendar} variant={tipo === 'receita' ? 'income' : 'expense'} />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Aging por Faixa</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="total" fill={tipo === 'receita' ? "hsl(var(--income))" : "hsl(var(--expense))"} radius={[4, 4, 0, 0]} />
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
                                <th className="text-left p-2">Faixa</th>
                                <th className="text-right p-2">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.range}</td>
                                    <td className={`text-right p-2 font-mono ${tipo === 'receita' ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(item.total)}
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
