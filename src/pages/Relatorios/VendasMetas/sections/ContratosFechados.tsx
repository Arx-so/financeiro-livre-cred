import { useState } from 'react';
import { ShoppingCart, Download, Printer } from 'lucide-react';
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
import { getContratosFechadosData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ContratosFechados() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });
    const [agrupamento, setAgrupamento] = useState<'vendedor' | 'canal' | 'produto' | undefined>(undefined);

    const { data, isLoading } = useQuery({
        queryKey: ['contratos-fechados', unidadeAtual?.id, dateRange, agrupamento],
        queryFn: () => getContratosFechadosData(unidadeAtual!.id, dateRange.start, dateRange.end, agrupamento),
        enabled: !!unidadeAtual?.id,
    });

    const totalQuantidade = data?.reduce((sum, d) => sum + d.quantidade, 0) || 0;
    const totalValor = data?.reduce((sum, d) => sum + d.valor, 0) || 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Contratos Fechados', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Período', 20, y);
        doc.text('Quantidade', 100, y);
        doc.text('Valor', 160, y);
        y += 10;

        for (const item of data) {
            doc.text(item.periodo, 20, y);
            doc.text(item.quantidade.toString(), 100, y);
            doc.text(formatCurrency(item.valor), 160, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`contratos-fechados-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.map(d => ({
            Período: d.periodo,
            Quantidade: d.quantidade,
            Valor: d.valor,
        })), `contratos-fechados-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Contratos Fechados</h2>
                    <p className="text-muted-foreground">
                        Análise de contratos fechados.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input-financial"
                        value={agrupamento || ''}
                        onChange={(e) => setAgrupamento(e.target.value ? e.target.value as 'vendedor' | 'canal' | 'produto' : undefined)}
                    >
                        <option value="">Por Período</option>
                        <option value="vendedor">Por Vendedor</option>
                        <option value="canal">Por Canal</option>
                        <option value="produto">Por Produto</option>
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

            {isLoading && <LoadingState />}
            {!isLoading && (!data || data.length === 0) && (
                <EmptyState icon={ShoppingCart} message="Sem dados para o período" />
            )}
            {!isLoading && data && data.length > 0 && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard label="Total Contratos" value={totalQuantidade.toString()} icon={ShoppingCart} variant="income" />
                <StatCard label="Valor Total" value={formatCurrency(totalValor)} icon={ShoppingCart} variant="income" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Evolução de Contratos Fechados</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip formatter={(value: number) => value.toString()} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="quantidade" name="Quantidade" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
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
                                <th className="text-right p-2">Quantidade</th>
                                <th className="text-right p-2">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.periodo}</td>
                                    <td className="text-right p-2">{item.quantidade}</td>
                                    <td className="text-right p-2 font-mono text-income">{formatCurrency(item.valor)}</td>
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
