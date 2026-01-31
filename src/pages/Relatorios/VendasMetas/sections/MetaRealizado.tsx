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
import { getMetaRealizadoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function MetaRealizado() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [tipo, setTipo] = useState<'individual' | 'equipe' | 'unidade'>('individual');
    const [periodo, setPeriodo] = useState({ year: currentYear, month: currentMonth });

    const { data, isLoading } = useQuery({
        queryKey: ['meta-realizado', unidadeAtual?.id, tipo, periodo],
        queryFn: () => getMetaRealizadoData(unidadeAtual!.id, tipo, periodo),
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
        doc.text(`Meta × Realizado - ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${periodo.month}/${periodo.year}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text(tipo === 'individual' ? 'Vendedor' : tipo === 'equipe' ? 'Equipe' : 'Unidade', 20, y);
        doc.text('Meta', 100, y);
        doc.text('Realizado', 160, y);
        doc.text('%', 220, y);
        y += 10;

        for (const item of data) {
            const key = item.vendedor || item.equipe || item.unidade || '';
            doc.text(key, 20, y);
            doc.text(formatCurrency(item.meta), 100, y);
            doc.text(formatCurrency(item.realizado), 160, y);
            doc.text(`${item.percentual.toFixed(2)}%`, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`meta-realizado-${tipo}-${periodo.year}-${periodo.month}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            [tipo === 'individual' ? 'Vendedor' : tipo === 'equipe' ? 'Equipe' : 'Unidade']: d.vendedor || d.equipe || d.unidade || '',
            Meta: d.meta,
            Realizado: d.realizado,
            Percentual: d.percentual,
            Diferença: d.diferenca,
        })), `meta-realizado-${tipo}-${periodo.year}-${periodo.month}`);
        toast.success('Relatório Excel gerado!');
    };

    const chartData = data?.map(item => ({
        name: item.vendedor || item.equipe || item.unidade || '',
        meta: item.meta,
        realizado: item.realizado,
    })) ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Meta × Realizado</h2>
                    <p className="text-muted-foreground">
                        Comparativo entre metas estabelecidas e valores realizados.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input-financial"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as 'individual' | 'equipe' | 'unidade')}
                    >
                        <option value="individual">Individual</option>
                        <option value="equipe">Equipe</option>
                        <option value="unidade">Unidade</option>
                    </select>
                    <input
                        type="number"
                        className="input-financial w-20"
                        value={periodo.month}
                        onChange={(e) => setPeriodo({ ...periodo, month: Number(e.target.value) })}
                        min={1}
                        max={12}
                    />
                    <input
                        type="number"
                        className="input-financial w-24"
                        value={periodo.year}
                        onChange={(e) => setPeriodo({ ...periodo, year: Number(e.target.value) })}
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
                <EmptyState icon={Target} message="Sem dados para o período" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Meta × Realizado</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
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
                                <th className="text-left p-2">{tipo === 'individual' ? 'Vendedor' : tipo === 'equipe' ? 'Equipe' : 'Unidade'}</th>
                                <th className="text-right p-2">Meta</th>
                                <th className="text-right p-2">Realizado</th>
                                <th className="text-right p-2">%</th>
                                <th className="text-right p-2">Diferença</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.vendedor || item.equipe || item.unidade || ''}</td>
                                    <td className="text-right p-2 font-mono">{formatCurrency(item.meta)}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.realizado)}</td>
                                    <td className={`text-right p-2 font-mono ${item.percentual >= 100 ? 'text-income' : 'text-expense'}`}>
                                        {item.percentual.toFixed(2)}%
                                    </td>
                                    <td className={`text-right p-2 font-mono ${item.diferenca >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(item.diferenca)}
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
