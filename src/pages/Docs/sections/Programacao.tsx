export function Programacao() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Programação Financeira</h2>
            <p className="text-muted-foreground">
                Visualize seus lançamentos em formato de calendário.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Recursos</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                    <strong>Calendário mensal:</strong>
                    {' '}
                    Navegue entre os meses usando as setas
                </li>
                <li>
                    <strong>Marcadores coloridos:</strong>
                    {' '}
                    Veja quais dias têm lançamentos pendentes
                </li>
                <li>
                    <strong>Cores:</strong>
                    {' '}
                    Verde para receitas, vermelho para despesas
                </li>
                <li>
                    <strong>Detalhes:</strong>
                    {' '}
                    Clique no dia para ver os lançamentos
                </li>
                <li>
                    <strong>Ação rápida:</strong>
                    {' '}
                    Marque como pago diretamente do calendário
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Resumo Lateral</h3>
            <p className="text-sm text-muted-foreground">
                Ao lado do calendário, você verá um resumo com:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Total de receitas do mês</li>
                <li>Total de despesas do mês</li>
                <li>Saldo do mês</li>
            </ul>
        </div>
    );
}
