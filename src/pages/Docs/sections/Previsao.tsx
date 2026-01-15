import { AlertCircle } from 'lucide-react';

export function Previsao() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Previsão de Caixa</h2>
            <p className="text-muted-foreground">
                Projete o fluxo de caixa futuro da sua empresa.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Como Usar</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                    <strong>Defina o período:</strong>
                    {' '}
                    Data inicial e final da projeção
                </li>
                <li>
                    <strong>Informe o saldo inicial:</strong>
                    {' '}
                    Valor atual disponível em caixa
                </li>
                <li>
                    <strong>Visualize o gráfico:</strong>
                    {' '}
                    Veja entradas, saídas e saldo projetado
                </li>
            </ol>

            <h3 className="text-lg font-semibold text-foreground mt-6">Legenda do Gráfico</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-income" />
                    <span className="text-sm text-muted-foreground">Linha verde: Entradas previstas</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-expense" />
                    <span className="text-sm text-muted-foreground">Linha vermelha: Saídas previstas</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-primary" />
                    <span className="text-sm text-muted-foreground">Área azul: Saldo projetado</span>
                </div>
            </div>

            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Alertas</h4>
                        <p className="text-sm text-muted-foreground">
                            O sistema alerta quando o saldo projetado fica negativo,
                            permitindo ações preventivas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
