import { useState } from 'react';
import { Target, Download, Printer } from 'lucide-react';
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
import { getComparativoPeriodoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function PrevistoRealizado() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [ano, setAno] = useState(currentYear);

    const { data, isLoading } = useQuery({
        queryKey: ['previsto-realizado', unidadeAtual?.id, ano],
        queryFn: () => getComparativoPeriodoData(unidadeAtual!.id, 'mensal', ano),
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
        doc.text('Previsto × Realizado', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Ano: ${ano}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Período', 20, y);
        doc.text('Previsto', 100, y);
        doc.text('Realizado', 160, y);
        doc.text('Variação', 220, y);
        y += 10;

        for (const item of data) {
            doc.text(item.periodo, 20, y);
            doc.text(formatCurrency(item.previsto), 100, y);
            doc.text(formatCurrency(item.realizado), 160, y);
            doc.text(`${item.variacaoPercent >= 0 ? '+' : ''}${item.variacaoPercent.toFixed(2)}%`, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`previsto-realizado-${ano}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Período: d.periodo,
            Previsto: d.previsto,
            Realizado: d.realizado,
            Variação: d.variacao,
            'Variação %': d.variacaoPercent,
        })), `previsto-realizado-${ano}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={Target} message="Sem dados para o período" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Previsto × Realizado</h2>
                    <p className="text-muted-foreground">
                        Comparativo entre valores previstos e realizados.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        className="input-financial w-24"
                        value={ano}
                        onChange={(e) => setAno(Number(e.target.value))}
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
                <h3 className="font-semibold text-foreground mb-4">Comparativo Previsto × Realizado</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                                <th className="text-left p-2">Período</th>
                                <th className="text-right p-2">Previsto</th>
                                <th className="text-right p-2">Realizado</th>
                                <th className="text-right p-2">Variação</th>
                                <th className="text-right p-2">Variação %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.periodo}</td>
                                    <td className="text-right p-2 font-mono">{formatCurrency(item.previsto)}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.realizado)}</td>
                                    <td className={`text-right p-2 font-mono ${item.variacao >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(item.variacao)}
                                    </td>
                                    <td className={`text-right p-2 font-mono ${item.variacaoPercent >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {item.variacaoPercent >= 0 ? '+' : ''}{item.variacaoPercent.toFixed(2)}%
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
