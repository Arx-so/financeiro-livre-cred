import { Clock, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useBranchStore } from '@/stores';
import { getInadimplenciaData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ClientesAtraso() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const { data, isLoading } = useQuery({
        queryKey: ['clientes-atraso', unidadeAtual?.id],
        queryFn: () => getInadimplenciaData(unidadeAtual!.id),
        enabled: !!unidadeAtual?.id,
    });

    const totalAtraso = data?.reduce((sum, d) => sum + d.valor, 0) || 0;
    const clientesAtraso = data?.length || 0;

    const handleExportPDF = () => {
        if (!data || data.length === 0) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Clientes em Atraso', pageWidth / 2, 20, { align: 'center' });
        doc.text(`Total: ${formatCurrency(totalAtraso)}`, pageWidth / 2, 28, { align: 'center' });

        let y = 50;
        doc.setFontSize(10);
        doc.text('Cliente', 20, y);
        doc.text('Valor', 100, y);
        doc.text('Dias Atraso', 160, y);
        doc.text('Último Pagamento', 220, y);
        y += 10;

        for (const item of data) {
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

        doc.save(`clientes-atraso-${new Date().toISOString().split('T')[0]}.pdf`);
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
        })), `clientes-atraso-${new Date().toISOString().split('T')[0]}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState icon={Clock} message="Nenhum cliente em atraso" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Clientes em Atraso</h2>
                    <p className="text-muted-foreground">
                        Lista de clientes com pagamentos em atraso.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard label="Total em Atraso" value={formatCurrency(totalAtraso)} icon={Clock} variant="expense" />
                <StatCard label="Clientes em Atraso" value={clientesAtraso.toString()} icon={Clock} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Lista de Clientes</h3>
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
