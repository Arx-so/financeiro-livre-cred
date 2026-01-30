import { Users, Download, Printer } from 'lucide-react';
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
import { getBaseAtivaClientesData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';

export function BaseAtivaClientes() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const { data, isLoading } = useQuery({
        queryKey: ['base-ativa-clientes', unidadeAtual?.id],
        queryFn: () => getBaseAtivaClientesData(unidadeAtual!.id),
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
        doc.text('Base Ativa de Clientes', pageWidth / 2, 20, { align: 'center' });

        let y = 50;
        doc.setFontSize(12);
        doc.text(`Total: ${data.total}`, 20, y);
        y += 10;
        doc.text(`Ativos: ${data.ativos}`, 20, y);
        y += 10;
        doc.text(`Inativos: ${data.inativos}`, 20, y);
        y += 10;
        doc.text(`Novos: ${data.novos}`, 20, y);
        y += 10;
        doc.text(`Crescimento: ${data.crescimento.toFixed(2)}%`, 20, y);

        doc.save(`base-ativa-clientes-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel([
            { Métrica: 'Total', Valor: data.total },
            { Métrica: 'Ativos', Valor: data.ativos },
            { Métrica: 'Inativos', Valor: data.inativos },
            { Métrica: 'Novos', Valor: data.novos },
            { Métrica: 'Crescimento (%)', Valor: data.crescimento },
        ], `base-ativa-clientes-${new Date().toISOString().split('T')[0]}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data) return <EmptyState icon={Users} message="Sem dados disponíveis" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Base Ativa de Clientes</h2>
                    <p className="text-muted-foreground">
                        Análise da base ativa de clientes.
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Total" value={data.total.toString()} icon={Users} variant="income" />
                <StatCard label="Ativos" value={data.ativos.toString()} icon={Users} variant="income" />
                <StatCard label="Inativos" value={data.inativos.toString()} icon={Users} variant="expense" />
                <StatCard label="Novos" value={data.novos.toString()} icon={Users} variant="income" />
                <StatCard label="Crescimento" value={`${data.crescimento.toFixed(2)}%`} icon={Users} variant={data.crescimento >= 0 ? 'income' : 'expense'} />
            </div>
        </div>
    );
}
