import {
    Repeat,
    CheckCircle2,
    FileText,
    AlertCircle,
    Building2,
} from 'lucide-react';

export function Financeiro() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
            <p className="text-muted-foreground">
                Módulo principal para gerenciamento de contas a pagar e receber.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Criar Novo Lançamento</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Clique em
                {' '}
                <strong>&quot;Novo Lançamento&quot;</strong>
                {' '}
                e preencha os seguintes campos:
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-medium text-foreground">Campo</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Descrição</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="py-2 px-3 text-foreground">Tipo</td>
                            <td className="py-2 px-3 text-muted-foreground">Receita ou Despesa</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Valor</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor em reais</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Status</td>
                            <td className="py-2 px-3 text-muted-foreground">Pendente, Pago, Atrasado ou Cancelado</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Descrição</td>
                            <td className="py-2 px-3 text-muted-foreground">Identificação do lançamento</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Data de Vencimento</td>
                            <td className="py-2 px-3 text-muted-foreground">Quando a conta vence</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Favorecido</td>
                            <td className="py-2 px-3 text-muted-foreground">Cliente ou fornecedor relacionado</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Categoria</td>
                            <td className="py-2 px-3 text-muted-foreground">Classificação para relatórios</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Conta Bancária</td>
                            <td className="py-2 px-3 text-muted-foreground">Para conciliação bancária</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Filial do Lançamento</h4>
                        <p className="text-sm text-muted-foreground">
                            O formulário de lançamento exibe claramente qual filial está selecionada no topo.
                            Isso evita confusão e garante que os lançamentos sejam registrados na filial correta.
                            Troque a filial no menu lateral caso necessário antes de criar um lançamento.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6 flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Lançamentos Recorrentes
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
                Para criar lançamentos que se repetem (aluguel, salários, assinaturas):
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                    Marque a opção
                    <strong>&quot;Lançamento recorrente&quot;</strong>
                </li>
                <li>
                    Escolha o
                    <strong>tipo de recorrência</strong>
                    : Diário, Semanal, Mensal ou Anual
                </li>
                <li>
                    Defina o
                    <strong>dia</strong>
                    {' '}
                    da recorrência (ex: dia 10 do mês)
                </li>
                <li>
                    Opcionalmente, defina uma
                    <strong>data de término</strong>
                </li>
            </ol>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Importante</h4>
                        <p className="text-sm text-muted-foreground">
                            Ao criar um lançamento recorrente, o sistema gera automaticamente os próximos
                            {' '}
                            <strong>12 lançamentos</strong>
                            .
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Filtros</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Por Mês:</strong>
                    {' '}
                    Selecione o mês/ano desejado
                </li>
                <li>
                    <strong>Por Tipo:</strong>
                    {' '}
                    Todos, Receitas ou Despesas
                </li>
                <li>
                    <strong>Busca:</strong>
                    {' '}
                    Pesquise por descrição, favorecido ou categoria
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Ações Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-income/10 rounded-lg text-center">
                    <CheckCircle2 className="w-6 h-6 text-income mx-auto mb-1" />
                    <p className="text-sm font-medium text-foreground">Marcar como Pago</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                    <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm font-medium text-foreground">Editar</p>
                </div>
                <div className="p-3 bg-expense/10 rounded-lg text-center">
                    <AlertCircle className="w-6 h-6 text-expense mx-auto mb-1" />
                    <p className="text-sm font-medium text-foreground">Cancelar</p>
                </div>
            </div>
        </div>
    );
}
