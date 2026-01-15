export function Relatorios() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
            <p className="text-muted-foreground">
                Análises financeiras detalhadas para tomada de decisão.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">DRE - Demonstração do Resultado</h4>
                    <p className="text-sm text-muted-foreground">
                        Visão consolidada de receitas e despesas, resultado líquido e margem percentual.
                    </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Por Categoria</h4>
                    <p className="text-sm text-muted-foreground">
                        Gráficos de pizza e barras mostrando distribuição de gastos por categoria.
                    </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Comparativo Mensal</h4>
                    <p className="text-sm text-muted-foreground">
                        Gráfico de evolução de receitas e despesas ao longo do ano.
                    </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Fluxo de Caixa</h4>
                    <p className="text-sm text-muted-foreground">
                        Projeção de entradas e saídas com alertas de saldo negativo.
                    </p>
                </div>
                <div className="p-4 border border-border rounded-lg md:col-span-2">
                    <h4 className="font-semibold text-foreground mb-2">Aging (Vencimentos)</h4>
                    <p className="text-sm text-muted-foreground">
                        Análise de contas por período de vencimento: A vencer, 1-30 dias,
                        31-60 dias, 61-90 dias, &gt;90 dias.
                    </p>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Exportação</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>PDF:</strong>
                    {' '}
                    Para impressão ou compartilhamento
                </li>
                <li>
                    <strong>Excel:</strong>
                    {' '}
                    Para análises adicionais em planilhas
                </li>
            </ul>
        </div>
    );
}
