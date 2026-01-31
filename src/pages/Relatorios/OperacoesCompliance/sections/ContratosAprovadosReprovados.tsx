import { useState } from 'react';
import { FileCheck, Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { useBranchStore } from '@/stores';
import { getContratosAprovadosReprovadosData } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { LoadingState, EmptyState, StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export function ContratosAprovadosReprovados() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['contratos-aprovados-reprovados', unidadeAtual?.id, dateRange],
        queryFn: () => getContratosAprovadosReprovadosData(unidadeAtual!.id, dateRange.start, dateRange.end),
        enabled: !!unidadeAtual?.id,
    });

    const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

    const handleExportPDF = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text('Contratos Aprovados × Reprovados', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Taxa de Aprovação: ${data.taxaAprovacao.toFixed(2)}%`, pageWidth / 2, 36, { align: 'center' });

        let y = 50;
        doc.setFontSize(12);
        doc.text(`Aprovados: ${data.aprovados}`, 20, y);
        y += 10;
        doc.text(`Reprovados: ${data.reprovados}`, 20, y);
        y += 10;
        doc.text(`Pendentes: ${data.pendentes}`, 20, y);
        y += 20;

        doc.setFontSize(10);
        doc.text('Contrato', 20, y);
        doc.text('Status', 100, y);
        doc.text('Valor', 160, y);
        doc.text('Data', 220, y);
        y += 10;

        for (const item of data.detalhes.slice(0, 30)) {
            doc.text(item.contrato.substring(0, 20), 20, y);
            doc.text(item.status, 100, y);
            doc.text(formatCurrency(item.valor), 160, y);
            doc.text(item.data, 220, y);
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save(`contratos-aprovados-reprovados-${dateRange.start}-${dateRange.end}.pdf`);
        toast.success('Relatório PDF gerado!');
    };

    const handleExportExcel = () => {
        if (!data) {
            toast.error('Sem dados para exportar');
            return;
        }

        exportToExcel(data.detalhes.map(d => ({
            Contrato: d.contrato,
            Status: d.status,
            Valor: d.valor,
            Data: d.data,
        })), `contratos-aprovados-reprovados-${dateRange.start}-${dateRange.end}`);
        toast.success('Relatório Excel gerado!');
    };

    const pieData = data ? [
        { name: 'Aprovados', value: data.aprovados },
        { name: 'Reprovados', value: data.reprovados },
        { name: 'Pendentes', value: data.pendentes },
    ] : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Contratos Aprovados × Reprovados</h2>
                    <p className="text-muted-foreground">
                        Análise de contratos aprovados e reprovados (consignado e outros serviços financeiros).
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
                <EmptyState icon={FileCheck} message="Sem dados para o período" />
            )}
            {!isLoading && data && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Aprovados" value={data.aprovados.toString()} icon={FileCheck} variant="income" />
                <StatCard label="Reprovados" value={data.reprovados.toString()} icon={FileCheck} variant="expense" />
                <StatCard label="Pendentes" value={data.pendentes.toString()} icon={FileCheck} variant="expense" />
                <StatCard label="Taxa Aprovação" value={`${data.taxaAprovacao.toFixed(2)}%`} icon={FileCheck} variant="income" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-financial p-6">
                    <h3 className="font-semibold text-foreground mb-4">Distribuição</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-financial p-6">
                    <h3 className="font-semibold text-foreground mb-4">Detalhes</h3>
                    <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-2">Contrato</th>
                                    <th className="text-left p-2">Status</th>
                                    <th className="text-right p-2">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.detalhes.slice(0, 10).map((item, i) => (
                                    <tr key={i} className="border-b border-border">
                                        <td className="p-2">{item.contrato}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                item.status === 'aprovado' || item.status === 'ativo' ? 'bg-green-100 text-green-800' :
                                                item.status === 'encerrado' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="text-right p-2 font-mono">{formatCurrency(item.valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
