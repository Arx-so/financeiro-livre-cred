import { Banknote, Umbrella, Stethoscope } from 'lucide-react';
import { EmptyState, LoadingState } from '@/components/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import type { PayrollWithEmployee } from '@/services/folhaPagamento';
import type { VacationWithEmployee } from '@/services/hrFerias';
import type { ExamWithEmployee } from '@/services/hrExames';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface TabRHProps {
    payrolls: PayrollWithEmployee[];
    vacations: VacationWithEmployee[];
    exams: ExamWithEmployee[];
    payrollLoading: boolean;
    vacationsLoading: boolean;
    examsLoading: boolean;
}

function FolhaTab({ payrolls, isLoading }: { payrolls: PayrollWithEmployee[]; isLoading: boolean }) {
    if (isLoading) return <LoadingState />;
    if (payrolls.length === 0) return <EmptyState icon={Banknote} message="Nenhuma folha de pagamento encontrada" />;

    return (
        <div className="card-financial overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Ref.</th>
                        <th className="text-right p-3 text-muted-foreground font-medium hidden sm:table-cell">Salário Base</th>
                        <th className="text-right p-3 text-muted-foreground font-medium hidden md:table-cell">Descontos</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Líquido</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {payrolls.map((p) => {
                        const totalDesc = p.inss_discount + p.irrf_discount + p.other_discounts;
                        return (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-medium text-foreground">
                                    {MONTHS[(p.reference_month ?? 1) - 1]} / {p.reference_year}
                                </td>
                                <td className="p-3 text-right font-mono-numbers text-muted-foreground hidden sm:table-cell">
                                    {formatCurrency(p.base_salary)}
                                </td>
                                <td className="p-3 text-right font-mono-numbers text-expense hidden md:table-cell">
                                    {formatCurrency(totalDesc)}
                                </td>
                                <td className="p-3 text-right font-mono-numbers font-semibold text-income">
                                    {formatCurrency(p.net_salary)}
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`badge ${p.status === 'pago' ? 'badge-success' : 'badge-warning'}`}>
                                        {p.status === 'pago' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function FeriasTab({ vacations, isLoading }: { vacations: VacationWithEmployee[]; isLoading: boolean }) {
    if (isLoading) return <LoadingState />;
    if (vacations.length === 0) return <EmptyState icon={Umbrella} message="Nenhum registro de férias encontrado" />;

    const statusLabel: Record<string, string> = {
        pendente: 'Pendente',
        programada: 'Programada',
        em_andamento: 'Em Andamento',
        concluida: 'Concluída',
    };
    const statusClass: Record<string, string> = {
        pendente: 'badge-warning',
        programada: 'badge-primary',
        em_andamento: 'badge-success',
        concluida: 'badge-neutral',
    };

    return (
        <div className="card-financial overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Admissão</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Vencimento</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Início</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Fim</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {vacations.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-foreground">{formatDate(v.admission_date)}</td>
                            <td className="p-3 text-muted-foreground hidden sm:table-cell">{formatDate(v.vacation_expiry_date)}</td>
                            <td className="p-3 text-muted-foreground hidden md:table-cell">{v.vacation_start_date ? formatDate(v.vacation_start_date) : '—'}</td>
                            <td className="p-3 text-muted-foreground hidden md:table-cell">{v.vacation_end_date ? formatDate(v.vacation_end_date) : '—'}</td>
                            <td className="p-3 text-center">
                                <span className={`badge ${statusClass[v.status] ?? 'badge-neutral'}`}>
                                    {statusLabel[v.status] ?? v.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ExamesTab({ exams, isLoading }: { exams: ExamWithEmployee[]; isLoading: boolean }) {
    if (isLoading) return <LoadingState />;
    if (exams.length === 0) return <EmptyState icon={Stethoscope} message="Nenhum exame ocupacional encontrado" />;

    const typeLabel: Record<string, string> = {
        admissional: 'Admissional',
        periodico: 'Periódico',
        demissional: 'Demissional',
    };

    return (
        <div className="card-financial overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Vencimento</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Obs.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {exams.map((exam) => {
                        const isExpired = exam.exam_expiry_date && new Date(exam.exam_expiry_date) < new Date();
                        return (
                            <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-medium text-foreground">
                                    {typeLabel[exam.exam_type] ?? exam.exam_type}
                                </td>
                                <td className="p-3 text-muted-foreground">{formatDate(exam.exam_date)}</td>
                                <td className={`p-3 hidden sm:table-cell ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {exam.exam_expiry_date ? formatDate(exam.exam_expiry_date) : '—'}
                                </td>
                                <td className="p-3 text-muted-foreground truncate hidden md:table-cell max-w-[150px]">
                                    {exam.notes ?? '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function TabRH({
    payrolls, vacations, exams, payrollLoading, vacationsLoading, examsLoading,
}: TabRHProps) {
    return (
        <Tabs defaultValue="folha">
            <TabsList className="mb-4">
                <TabsTrigger value="folha">Folha ({payrolls.length})</TabsTrigger>
                <TabsTrigger value="ferias">Férias ({vacations.length})</TabsTrigger>
                <TabsTrigger value="exames">Exames ({exams.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="folha">
                <FolhaTab payrolls={payrolls} isLoading={payrollLoading} />
            </TabsContent>
            <TabsContent value="ferias">
                <FeriasTab vacations={vacations} isLoading={vacationsLoading} />
            </TabsContent>
            <TabsContent value="exames">
                <ExamesTab exams={exams} isLoading={examsLoading} />
            </TabsContent>
        </Tabs>
    );
}
