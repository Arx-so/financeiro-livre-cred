import { Lightbulb, AlertCircle } from 'lucide-react';

export function FolhaPagamento() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Folha de Pagamento</h2>
            <p className="text-muted-foreground">
                Gestao completa da folha de pagamento com calculo automatico
                de salario liquido e integracao com o modulo financeiro.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Criar Folha</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Clique em
                {' '}
                <strong>&quot;Nova Folha&quot;</strong>
                {' '}
                e preencha:
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-medium text-foreground">Campo</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Descricao</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="py-2 px-3 text-foreground">Funcionario</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Favorecido do tipo &quot;Funcionario&quot;
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Mes/Ano</td>
                            <td className="py-2 px-3 text-muted-foreground">Periodo de referencia</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Salario Base</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor do salario contratual</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Horas Extras</td>
                            <td className="py-2 px-3 text-muted-foreground">Quantidade e valor das horas extras</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h4 className="font-medium text-foreground mt-4">Beneficios</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Vale Transporte</li>
                <li>Vale Alimentacao</li>
                <li>Outros Beneficios</li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Descontos</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>INSS</li>
                <li>IRRF</li>
                <li>Outros Descontos</li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Calculo do Salario Liquido</h4>
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <p className="text-sm font-mono text-foreground">
                    Salario Liquido = (Salario Base + Horas Extras + Beneficios) - Descontos
                </p>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mt-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Gerar Lancamento Financeiro</h4>
                        <p className="text-sm text-muted-foreground">
                            Use o botao
                            {' '}
                            <strong>&quot;Gerar Lancamento&quot;</strong>
                            {' '}
                            para criar automaticamente uma despesa financeira
                            com o valor do salario liquido. O lancamento e vinculado
                            ao funcionario e ao periodo da folha.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Cadastre seus funcionarios como favorecidos do tipo
                            &quot;Funcionario&quot; para que aparecam no seletor da folha de pagamento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
