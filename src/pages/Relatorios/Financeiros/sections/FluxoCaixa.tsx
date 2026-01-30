import { useState } from 'react';
import { Calendar, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getFluxoCaixaData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function FluxoCaixa() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });
    const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensal'>('diario');

    const { data, isLoading } = useQuery({
        queryKey: ['fluxo-caixa', unidadeAtual?.id, dateRange, periodo],
        queryFn: () => getFluxoCaixaData(unidadeAtual!.id, dateRange.start, dateRange.end, periodo),
        enabled: !!unidadeAtual?.id,
    });

    const saldoFinal = data && data.length > 0 ? data[data.length - 1].saldoAcumulado : 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text(`Fluxo de Caixa ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`, pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Saldo Final: ${formatCurrency(saldoFinal)}`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Data', 20, y);
        doc.text('Entrada', 80, y);
        doc.text('Saída', 140, y);
        doc.text('Saldo', 200, y);
        y += 10;

        for (const item of data.slice(0, 30)) {
            doc.text(item.date, 20, y);
            doc.text(formatCurrency(item.entrada), 80, y);
            doc.text(formatCurrency(item.saida), 140, y);
            doc.text(formatCurrency(item.saldoAcumulado), 200, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`fluxo-caixa-${periodo}-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Data: d.date,
            Entrada: d.entrada,
            Saída: d.saida,
            Saldo: d.saldo,
            'Saldo Acumulado': d.saldoAcumulado,
        })), `fluxo-caixa-${periodo}-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={Calendar} message="Sem dados para o período" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Fluxo de Caixa Diário / Semanal / Mensal</h2>
                    <p className="text-muted-foreground">
                        Análise do fluxo de caixa por período.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input-financial"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value as 'diario' | 'semanal' | 'mensal')}
                    >
                        <option value="diario">Diário</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Saldo Final" value={formatCurrency(saldoFinal)} icon={Calendar} variant={saldoFinal >= 0 ? 'income' : 'expense'} />
                <StatCard label="Total Entradas" value={formatCurrency(data.reduce((sum, d) => sum + d.entrada, 0))} icon={Calendar} variant="income" />
                <StatCard label="Total Saídas" value={formatCurrency(data.reduce((sum, d) => sum + d.saida, 0))} icon={Calendar} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Evolução do Saldo</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="saldoAcumulado" name="Saldo Acumulado" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
