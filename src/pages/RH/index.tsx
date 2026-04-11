import { useNavigate } from 'react-router-dom';
import {
    Users, AlertTriangle, Calendar, FileText, Bell, Bus, Stethoscope, ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHrDashboardSummary, useActiveHrAlerts, useDismissHrAlert, useGenerateHrAlerts } from '@/hooks/useHrAlerts';
import { ALERT_TYPE_LABELS, ALERT_PRIORITY } from '@/constants/hr';

function getPriorityColor(alertType: string): string {
    const priority = ALERT_PRIORITY[alertType] ?? 99;
    if (priority <= 2) return 'destructive';
    if (priority <= 4) return 'secondary';
    return 'outline';
}

export default function RhDashboard() {
    const navigate = useNavigate();
    const { data: summary, isLoading: summaryLoading } = useHrDashboardSummary();
    const { data: alerts, isLoading: alertsLoading } = useActiveHrAlerts();
    const dismissMutation = useDismissHrAlert();
    const generateMutation = useGenerateHrAlerts();

    const handleDismiss = (id: string) => {
        dismissMutation.mutate(id, {
            onSuccess: () => toast.success('Alerta dispensado.'),
            onError: () => toast.error('Erro ao dispensar alerta.'),
        });
    };

    const handleGenerate = () => {
        generateMutation.mutate(undefined, {
            onSuccess: () => toast.success('Alertas atualizados com sucesso.'),
            onError: () => toast.error('Erro ao gerar alertas.'),
        });
    };

    const sortedAlerts = [...(alerts ?? [])].sort(
        (a, b) => (ALERT_PRIORITY[a.alert_type] ?? 99) - (ALERT_PRIORITY[b.alert_type] ?? 99),
    );

    const quickLinks = [
        { label: 'Férias', href: '/rh/ferias', icon: Calendar, description: 'Controle de férias dos funcionários' },
        { label: 'Exames', href: '/rh/exames', icon: Stethoscope, description: 'Exames ocupacionais' },
        { label: 'Vale Transporte', href: '/rh/vale-transporte', icon: Bus, description: 'Recargas e relatórios de VT' },
        { label: 'Calendário', href: '/rh/calendario', icon: Calendar, description: 'Feriados corporativos' },
        { label: 'Atestados', href: '/rh/atestados', icon: ClipboardList, description: 'Atestados médicos e declarações' },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Recursos Humanos" description="Visão geral do módulo de RH">
                    <Button variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending}>
                        <Bell className="w-4 h-4 mr-2" />
                        {generateMutation.isPending ? 'Atualizando...' : 'Atualizar Alertas'}
                    </Button>
                </PageHeader>

                {summaryLoading ? (
                    <LoadingState message="Carregando resumo..." />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard
                            label="Férias Vencendo"
                            value={summary?.vacationsExpiring ?? 0}
                            icon={Calendar}
                            variant={summary?.vacationsExpiring ? 'pending' : 'default'}
                        />
                        <StatCard
                            label="Férias em Andamento"
                            value={summary?.vacationsInProgress ?? 0}
                            icon={Calendar}
                            variant="primary"
                        />
                        <StatCard
                            label="Exames Vencendo"
                            value={summary?.examsExpiring ?? 0}
                            icon={Stethoscope}
                            variant={summary?.examsExpiring ? 'expense' : 'default'}
                        />
                        <StatCard
                            label="Aniversários do Mês"
                            value={summary?.birthdaysThisMonth ?? 0}
                            icon={Users}
                            variant="income"
                        />
                        <StatCard
                            label="Atestados (mês)"
                            value={summary?.certificatesThisMonth ?? 0}
                            icon={FileText}
                            variant="default"
                        />
                        <StatCard
                            label="Dias de Ausência"
                            value={summary?.certificateDaysThisMonth ?? 0}
                            icon={AlertTriangle}
                            variant={summary?.certificateDaysThisMonth ? 'pending' : 'default'}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alert Panel */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Alertas Ativos
                                    {sortedAlerts.length > 0 && (
                                        <Badge variant="destructive" className="ml-1">{sortedAlerts.length}</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {alertsLoading ? (
                                    <LoadingState message="Carregando alertas..." />
                                ) : sortedAlerts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        Nenhum alerta ativo no momento.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {sortedAlerts.slice(0, 10).map((alert) => (
                                            <div
                                                key={alert.id}
                                                className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge
                                                            variant={getPriorityColor(alert.alert_type) as
                                                                'destructive' | 'secondary' | 'outline'}
                                                            className="text-xs"
                                                        >
                                                            {ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
                                                        </Badge>
                                                        {alert.employee?.name && (
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {alert.employee.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-foreground">{alert.alert_title}</p>
                                                    {alert.alert_message && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                            {alert.alert_message}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="shrink-0 text-xs h-7"
                                                    onClick={() => handleDismiss(alert.id)}
                                                    disabled={dismissMutation.isPending}
                                                >
                                                    Dispensar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-base">Módulos RH</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {quickLinks.map((link) => (
                                        <button
                                            key={link.href}
                                            type="button"
                                            onClick={() => navigate(link.href)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                                        >
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <link.icon className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{link.label}</p>
                                                <p className="text-xs text-muted-foreground">{link.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
