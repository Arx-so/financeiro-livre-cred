import { useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useBranchStore } from '@/stores';
import { getDashboardGeralData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function DashboardGeral() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-geral', unidadeAtual?.id, dateRange],
        queryFn: () => getDashboardGeralData(unidadeAtual!.id, dateRange.start, dateRange.end),
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
        doc.text('Dashboard Geral do Negócio', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(12);
        doc.text(`Receita Bruta: ${formatCurrency(data.receitaBruta)}`, 20, y);
        y += 10;
        doc.text(`Receita Líquida: ${formatCurrency(data.receitaLiquida)}`, 20, y);
        y += 10;
        doc.text(`Despesas Totais: ${formatCurrency(data.despesasTotais)}`, 20, y);
        y += 10;
        doc.text(`Lucro Operacional: ${formatCurrency(data.lucroOperacional)}`, 20, y);
        y += 10;
        doc.text(`Margem Bruta: ${data.margemBruta.toFixed(2)}%`, 20, y);
        y += 10;
        doc.text(`Margem Líquida: ${data.margemLiquida.toFixed(2)}%`, 20, y);
        y += 10;
        doc.text(`Ticket Médio: ${formatCurrency(data.ticketMedio)}`, 20, y);
        y += 10;
        doc.text(`Total de Vendas: ${formatCurrency(data.totalVendas)}`, 20, y);
        y += 10;
        doc.text(`Total de Contratos: ${data.totalContratos}`, 20, y);

        doc.save(`dashboard-geral-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        const excelData = [
            { Indicador: 'Receita Bruta', Valor: data.receitaBruta },
            { Indicador: 'Receita Líquida', Valor: data.receitaLiquida },
            { Indicador: 'Despesas Totais', Valor: data.despesasTotais },
            { Indicador: 'Lucro Operacional', Valor: data.lucroOperacional },
            { Indicador: 'Margem Bruta (%)', Valor: data.margemBruta },
            { Indicador: 'Margem Líquida (%)', Valor: data.margemLiquida },
            { Indicador: 'Ticket Médio', Valor: data.ticketMedio },
            { Indicador: 'Total de Vendas', Valor: data.totalVendas },
            { Indicador: 'Total de Contratos', Valor: data.totalContratos },
        ];

        exportToExcel(excelData, `dashboard-geral-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dashboard Geral do Negócio</h2>
                    <p className="text-muted-foreground">
                        Visão consolidada de todos os indicadores principais do negócio.
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
            {!isLoading && !data && (
                <EmptyState icon={BarChart3} message="Sem dados para o período" />
            )}
            {!isLoading && data && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Receita Bruta" value={formatCurrency(data.receitaBruta)} icon={BarChart3} variant="income" />
                <StatCard label="Receita Líquida" value={formatCurrency(data.receitaLiquida)} icon={BarChart3} variant="income" />
                <StatCard label="Despesas Totais" value={formatCurrency(data.despesasTotais)} icon={BarChart3} variant="expense" />
                <StatCard label="Lucro Operacional" value={formatCurrency(data.lucroOperacional)} icon={BarChart3} variant={data.lucroOperacional >= 0 ? 'income' : 'expense'} />
                <StatCard label="Margem Bruta" value={`${data.margemBruta.toFixed(2)}%`} icon={BarChart3} variant="income" />
                <StatCard label="Margem Líquida" value={`${data.margemLiquida.toFixed(2)}%`} icon={BarChart3} variant={data.margemLiquida >= 0 ? 'income' : 'expense'} />
                <StatCard label="Ticket Médio" value={formatCurrency(data.ticketMedio)} icon={BarChart3} variant="income" />
                <StatCard label="Total de Vendas" value={formatCurrency(data.totalVendas)} icon={BarChart3} variant="income" />
                <StatCard label="Total de Contratos" value={data.totalContratos.toString()} icon={BarChart3} variant="income" />
            </div>
            </>
            )}
        </div>
    );
}
