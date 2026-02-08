import {
    Lightbulb,
    AlertCircle,
    DollarSign,
} from 'lucide-react';

export function Planejamento() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Planejamento</h2>
            <p className="text-muted-foreground">
                Modulo de planejamento financeiro com tres abas: Orcamento, Metas de Vendas e Comissoes.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Orcamento</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Planejamento orcamentario anual por categoria e subcategoria:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Versoes:</strong>
                    {' '}
                    Crie multiplas versoes do orcamento (rascunho, aprovado, arquivado)
                </li>
                <li>
                    <strong>Duplicar versao:</strong>
                    {' '}
                    Copie uma versao existente para criar variantes
                </li>
                <li>
                    <strong>Aprovar versao:</strong>
                    {' '}
                    Gerentes e admins podem aprovar versoes (torna somente leitura)
                </li>
                <li>
                    <strong>Arquivar versao:</strong>
                    {' '}
                    Mova versoes antigas para arquivo
                </li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Visualizacoes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-medium text-foreground">Planejamento (Arvore)</h4>
                    <p className="text-sm text-muted-foreground">
                        Visualizacao hierarquica por categoria com valores mensais editaveis
                    </p>
                </div>
                <div className="p-3 bg-income/10 rounded-lg border border-income/20">
                    <h4 className="font-medium text-foreground">Comparativo</h4>
                    <p className="text-sm text-muted-foreground">
                        Orcado vs Realizado com graficos e variacao percentual
                    </p>
                </div>
            </div>

            <h4 className="font-medium text-foreground mt-4">Cards de Resumo</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Total Orcado no ano</li>
                <li>Total Realizado (valor efetivo)</li>
                <li>Variacao (diferenca orcado vs realizado)</li>
                <li>Percentual de Execucao</li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Criar Item de Orcamento</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Categoria:</strong>
                    {' '}
                    Selecione a categoria (receita ou despesa)
                </li>
                <li>
                    <strong>Subcategoria:</strong>
                    {' '}
                    Opcional - para detalhamento mais fino
                </li>
                <li>
                    <strong>Valor Anual:</strong>
                    {' '}
                    Distribuido igualmente nos 12 meses
                </li>
            </ul>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Na visao de arvore, voce pode editar valores mensais individualmente
                            clicando diretamente nas celulas da tabela.
                        </p>
                    </div>
                </div>
            </div>

            <hr className="border-border" />

            <h3 className="text-lg font-semibold text-foreground">Metas de Vendas</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Defina metas mensais por vendedor e acompanhe o atingimento:
            </p>

            <h4 className="font-medium text-foreground mt-4">Criar Nova Meta</h4>
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
                            <td className="py-2 px-3 text-foreground">Vendedor</td>
                            <td className="py-2 px-3 text-muted-foreground">Selecione o vendedor</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Meta</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor alvo de vendas no mes</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">% Comissao</td>
                            <td className="py-2 px-3 text-muted-foreground">Percentual de comissao sobre vendas (padrao 5%)</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Bonus</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor fixo pago se a meta for atingida</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h4 className="font-medium text-foreground mt-4">Cards de Resumo</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Total da Meta</li>
                <li>Total Vendido</li>
                <li>Numero de Vendedores</li>
                <li>Percentual de Atingimento</li>
            </ul>

            <hr className="border-border" />

            <h3 className="text-lg font-semibold text-foreground">Comissoes</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Visualize as comissoes calculadas para cada vendedor no mes selecionado:
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                    <thead className="bg-muted">
                        <tr>
                            <th className="py-2 px-3 text-left font-medium text-foreground">Coluna</th>
                            <th className="py-2 px-3 text-left font-medium text-foreground">Descricao</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="py-2 px-3 text-foreground">Vendedor</td>
                            <td className="py-2 px-3 text-muted-foreground">Nome do vendedor</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Meta</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor alvo de vendas</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Vendido</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor efetivamente vendido</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">% Comissao</td>
                            <td className="py-2 px-3 text-muted-foreground">Taxa de comissao aplicada</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Comissao</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor calculado (vendido x taxa)</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Bonus</td>
                            <td className="py-2 px-3 text-muted-foreground">Valor fixo (apenas se meta atingida)</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Total</td>
                            <td className="py-2 px-3 text-muted-foreground">Comissao + Bonus</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mt-4">
                <div className="flex gap-3">
                    <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Gerar Financeiro</h4>
                        <p className="text-sm text-muted-foreground">
                            Cada linha da tabela de comissoes possui um botao
                            {' '}
                            <strong>&quot;Gerar Financeiro&quot;</strong>
                            {' '}
                            que cria automaticamente um lancamento de despesa
                            com o valor total da comissao (comissao + bonus) do vendedor,
                            com vencimento no ultimo dia do mes selecionado.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Importante</h4>
                        <p className="text-sm text-muted-foreground">
                            O bonus so e pago quando o valor vendido atinge ou supera a meta.
                            Caso contrario, apenas a comissao e calculada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
