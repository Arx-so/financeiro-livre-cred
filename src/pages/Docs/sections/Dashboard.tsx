import { ChevronRight, Lightbulb } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">
                A página inicial oferece uma visão consolidada das finanças da sua empresa.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-6">Recursos Disponíveis</h3>
            <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Resumo Financeiro</h4>
                        <p className="text-sm text-muted-foreground">Cards com total de receitas, despesas e saldo do período</p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Gráfico de Evolução</h4>
                        <p className="text-sm text-muted-foreground">Visualização mensal de receitas vs despesas ao longo do ano</p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Próximos Pagamentos</h4>
                        <p className="text-sm text-muted-foreground">Lista de contas a vencer nos próximos dias</p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Transações Recentes</h4>
                        <p className="text-sm text-muted-foreground">Últimos lançamentos registrados no sistema</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Use o seletor de ano para visualizar dados históricos.
                            Clique em &quot;Ver todos&quot; para acessar a lista completa de lançamentos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
