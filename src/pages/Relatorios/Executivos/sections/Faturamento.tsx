import { useState } from 'react';
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
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getFaturamentoData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function Faturamento() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['faturamento', unidadeAtual?.id, dateRange],
        queryFn: () => getFaturamentoData(unidadeAtual!.id, dateRange.start, dateRange.end),
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
        doc.text('Faturamento Bruto e Líquido', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Data', 20, y);
        doc.text('Bruto', 80, y);
        doc.text('Líquido', 140, y);
        doc.text('Deduções', 200, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.date, 20, y);
            doc.text(formatCurrency(item.bruto), 80, y);
            doc.text(formatCurrency(item.liquido), 140, y);
            doc.text(formatCurrency(item.deducoes), 200, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`faturamento-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Data: d.date,
            'Faturamento Bruto': d.bruto,
            'Faturamento Líquido': d.liquido,
            Deduções: d.deducoes,
        })), `faturamento-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Faturamento Bruto e Líquido</h2>
                    <p className="text-muted-foreground">
                        Análise do faturamento bruto e líquido do negócio.
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
                <h3 className="font-semibold text-foreground mb-4">Evolução do Faturamento</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="bruto" name="Faturamento Bruto" stroke="hsl(var(--income))" strokeWidth={2} />
                            <Line type="monotone" dataKey="liquido" name="Faturamento Líquido" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Resumo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Bruto</p>
                        <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(data.reduce((sum, d) => sum + d.bruto, 0))}
                        </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Líquido</p>
                        <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(data.reduce((sum, d) => sum + d.liquido, 0))}
                        </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Deduções</p>
                        <p className="text-2xl font-bold text-expense">
                            {formatCurrency(data.reduce((sum, d) => sum + d.deducoes, 0))}
                        </p>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
