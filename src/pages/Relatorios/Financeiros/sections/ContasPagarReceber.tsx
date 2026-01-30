import { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
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
import { getContasPagarReceberData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ContasPagarReceber() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const [tipo, setTipo] = useState<'pagar' | 'receber'>('receber');

    const { data, isLoading } = useQuery({
        queryKey: ['contas-pagar-receber', unidadeAtual?.id, tipo],
        queryFn: () => getContasPagarReceberData(unidadeAtual!.id),
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
        doc.text(`Contas a ${tipo === 'receber' ? 'Receber' : 'Pagar'}`, pageWidth / 2, 20, { align: 'center' });

        let y = 50;
        doc.setFontSize(12);
        doc.text(`Total: ${formatCurrency(data.total)}`, 20, y);
        y += 10;
        doc.text(`Pago: ${formatCurrency(data.pago)}`, 20, y);
        y += 10;
        doc.text(`Pendente: ${formatCurrency(data.pendente)}`, 20, y);
        y += 10;
        doc.text(`Atrasado: ${formatCurrency(data.atrasado)}`, 20, y);
        y += 20;

        doc.setFontSize(10);
        doc.text('Favorecido', 20, y);
        doc.text('Valor', 100, y);
        doc.text('Vencimento', 160, y);
        doc.text('Status', 220, y);
        y += 10;

        for (const item of data.detalhes.slice(0, 30)) {
            doc.text(item.favorecido, 20, y);
            doc.text(formatCurrency(item.valor), 100, y);
            doc.text(item.vencimento, 160, y);
            doc.text(item.status, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`contas-${tipo}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.detalhes.map(d => ({
            Favorecido: d.favorecido,
            Valor: d.valor,
            Vencimento: d.vencimento,
            Status: d.status,
        })), `contas-${tipo}-${new Date().toISOString().split('T')[0]}`);
        toast.success('Relatório Excel gerado!');
    };

    if (isLoading) return <LoadingState />;
    if (!data) return <EmptyState icon={FileText} message="Sem dados disponíveis" />;

    const chartData = [
        { name: 'Pago', valor: data.pago },
        { name: 'Pendente', valor: data.pendente },
        { name: 'Atrasado', valor: data.atrasado },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Contas a Pagar e a Receber</h2>
                    <p className="text-muted-foreground">
                        Relatório de contas a pagar e receber.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input-financial"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as 'pagar' | 'receber')}
                    >
                        <option value="receber">A Receber</option>
                        <option value="pagar">A Pagar</option>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total" value={formatCurrency(data.total)} icon={FileText} variant="income" />
                <StatCard label="Pago" value={formatCurrency(data.pago)} icon={FileText} variant="income" />
                <StatCard label="Pendente" value={formatCurrency(data.pendente)} icon={FileText} variant="expense" />
                <StatCard label="Atrasado" value={formatCurrency(data.atrasado)} icon={FileText} variant="expense" />
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Distribuição</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Detalhes</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-2">Favorecido</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-right p-2">Vencimento</th>
                                <th className="text-left p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.detalhes.map((item, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td className="p-2">{item.favorecido}</td>
                                    <td className="text-right p-2 font-mono">{formatCurrency(item.valor)}</td>
                                    <td className="text-right p-2">{item.vencimento}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            item.status === 'pago' ? 'bg-green-100 text-green-800' :
                                            item.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {item.status}
                                        </span>
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
