import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Bus } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { FavorecidoSelect } from '@/components/shared/FavorecidoSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useVtRecharges, useVtMonthlyReport, useCreateVtRecharge } from '@/hooks/useValeTransporte';
import { useBranchStore } from '@/stores';
import type { VtRechargeInsert } from '@/types/database';

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
];

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(new Date(`${date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface VtFormData {
    employee_id: string;
    recharge_date: string;
    recharge_amount: number;
    notes: string;
    // calculated fields (not stored directly — recharge_amount is stored)
    daily_rate: number;
    working_days: number;
}

const DEFAULT_FORM: VtFormData = {
    employee_id: '',
    recharge_date: new Date().toISOString().split('T')[0],
    recharge_amount: 0,
    notes: '',
    daily_rate: 9.00,
    working_days: 24,
};

export default function ValeTransporte() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<VtFormData>(DEFAULT_FORM);

    const { data: recharges, isLoading: rechargesLoading } = useVtRecharges({
        month: selectedMonth,
        year: selectedYear,
    });

    const { data: monthlyReport, isLoading: reportLoading } = useVtMonthlyReport(selectedMonth, selectedYear);

    const createMutation = useCreateVtRecharge();

    const handleFormChange = (field: keyof VtFormData, value: string | number) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            if (field === 'daily_rate' || field === 'working_days') {
                updated.recharge_amount = Number(updated.daily_rate) * Number(updated.working_days);
            }
            return updated;
        });
    };

    const handleSubmit = () => {
        if (!formData.employee_id || !formData.recharge_date || formData.recharge_amount <= 0) {
            toast.error('Preencha os campos obrigatórios: funcionário, data e valor.');
            return;
        }

        const insertData: VtRechargeInsert = {
            branch_id: branchId,
            employee_id: formData.employee_id,
            recharge_date: formData.recharge_date,
            recharge_amount: formData.recharge_amount,
            notes: formData.notes || null,
        };

        createMutation.mutate(insertData, {
            onSuccess: () => { toast.success('Recarga de VT registrada.'); setIsModalOpen(false); },
            onError: () => toast.error('Erro ao registrar recarga.'),
        });
    };

    const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Vale Transporte" description="Controle de recargas de Vale Transporte">
                    <Button onClick={() => { setFormData(DEFAULT_FORM); setIsModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Recarregamento
                    </Button>
                </PageHeader>

                {/* Period Selector */}
                <div className="flex gap-3">
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Tabs defaultValue="relatorio">
                    <TabsList>
                        <TabsTrigger value="relatorio">Relatório Mensal</TabsTrigger>
                        <TabsTrigger value="recargas">Recargas Individuais</TabsTrigger>
                    </TabsList>

                    <TabsContent value="relatorio" className="mt-4">
                        {reportLoading ? (
                            <LoadingState message="Gerando relatório..." />
                        ) : !monthlyReport || monthlyReport.rows.length === 0 ? (
                            <EmptyState icon={Bus} message="Nenhuma recarga registrada no período." />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead className="text-right">Nº de Recargas</TableHead>
                                            <TableHead className="text-right">Total VT</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {monthlyReport.rows.map((row) => (
                                            <TableRow key={row.employee_id}>
                                                <TableCell className="font-medium">{row.employee_name}</TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {row.recharge_count}
                                                </TableCell>
                                                <TableCell className="text-right font-mono-numbers">
                                                    {formatCurrency(row.total_amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell>Total Geral</TableCell>
                                            <TableCell />
                                            <TableCell className="text-right font-mono-numbers">
                                                {formatCurrency(monthlyReport.grand_total)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="recargas" className="mt-4">
                        {rechargesLoading ? (
                            <LoadingState message="Carregando recargas..." />
                        ) : !recharges || recharges.length === 0 ? (
                            <EmptyState icon={Bus} message="Nenhuma recarga encontrada no período." />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead>Observações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recharges.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">
                                                    {r.employee?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(r.recharge_date)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono-numbers">
                                                    {formatCurrency(r.recharge_amount)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {r.notes ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Novo Recarregamento de VT</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="sm:col-span-2">
                            <Label>Funcionário *</Label>
                            <FavorecidoSelect
                                value={formData.employee_id}
                                onChange={(id) => handleFormChange('employee_id', id)}
                                placeholder="Selecionar funcionário"
                                filterType="funcionario"
                            />
                        </div>

                        <div>
                            <Label htmlFor="recharge_date">Data da Recarga *</Label>
                            <Input
                                id="recharge_date"
                                type="date"
                                value={formData.recharge_date}
                                onChange={(e) => handleFormChange('recharge_date', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="daily_rate">Valor Diário (R$)</Label>
                            <Input
                                id="daily_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.daily_rate}
                                onChange={(e) => handleFormChange('daily_rate', Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="working_days">Dias de Trabalho</Label>
                            <Input
                                id="working_days"
                                type="number"
                                min="1"
                                max="31"
                                value={formData.working_days}
                                onChange={(e) => handleFormChange('working_days', Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="recharge_amount">Total VT (R$)</Label>
                            <Input
                                id="recharge_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.recharge_amount}
                                onChange={(e) => handleFormChange('recharge_amount', Number(e.target.value))}
                                className="font-mono-numbers"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(formData.daily_rate)}
                                {' × '}
                                {formData.working_days}
                                {' dias = '}
                                {formatCurrency(formData.daily_rate * formData.working_days)}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="vt_notes">Observações</Label>
                            <Textarea
                                id="vt_notes"
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => handleFormChange('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
