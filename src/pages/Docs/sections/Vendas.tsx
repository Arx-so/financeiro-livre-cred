import {
    AlertCircle,
    Lightbulb,
    Plus,
    FileText,
    DollarSign,
    CheckCircle2,
} from 'lucide-react';

export function Vendas() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Vendas</h2>
            <p className="text-muted-foreground">
                Modulo completo para gestao de vendas, contratos e geracao
                automatica de lancamentos financeiros.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Criar Nova Venda</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Clique em
                {' '}
                <strong>&quot;Nova Venda&quot;</strong>
                {' '}
                e preencha os campos:
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
                            <td className="py-2 px-3 text-foreground">Titulo</td>
                            <td className="py-2 px-3 text-muted-foreground">Identificacao da venda/contrato</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Cliente</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Favorecido vinculado (botao + para criar inline)
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Produto</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Produto cadastrado - apenas ativos (botao + para criar inline)
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Vendedor</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Vendedor responsavel (botao + para criar inline)
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Valor</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Valor total (validado contra limites do produto)
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Periodo</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Data de inicio e termino (validado contra prazo do produto)
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Dia de Vencimento</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Dia do mes (1-31) para vencimento das parcelas
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Taxa de Juros</td>
                            <td className="py-2 px-3 text-muted-foreground">
                                Juros mensal (% a.m.) - calculo via Tabela Price
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Categoria</td>
                            <td className="py-2 px-3 text-muted-foreground">Classificacao do contrato</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                    <Plus className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Criacao Inline</h4>
                        <p className="text-sm text-muted-foreground">
                            Use os botoes
                            {' '}
                            <strong>+</strong>
                            {' '}
                            ao lado dos campos Cliente, Produto e Vendedor para criar
                            um novo registro sem sair do formulario. O novo item e
                            automaticamente selecionado apos a criacao.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Regras do Produto</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Ao selecionar um produto, um painel de regras e exibido mostrando:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Limites de valor:</strong>
                    {' '}
                    Minimo e maximo permitidos
                </li>
                <li>
                    <strong>Limites de prazo:</strong>
                    {' '}
                    Meses minimos e maximos
                </li>
                <li>
                    <strong>Taxa de juros:</strong>
                    {' '}
                    Faixa permitida (min/max % a.m.)
                </li>
                <li>
                    <strong>Taxas:</strong>
                    {' '}
                    Cadastro, operacao, seguro, IOF
                </li>
                <li>
                    <strong>Comissao:</strong>
                    {' '}
                    Tipo (fixa/percentual) e valores
                </li>
                <li>
                    <strong>Faturamento:</strong>
                    {' '}
                    Boleto, debito, consignado, etc.
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Fluxo de Aprovacao</h3>
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-muted rounded-full font-medium">Criado</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="px-3 py-1 bg-warning/20 rounded-full font-medium">Em Aprovacao</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="px-3 py-1 bg-income/20 rounded-full font-medium">Aprovado</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="px-3 py-1 bg-primary/20 rounded-full font-medium">Ativo</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="px-3 py-1 bg-muted rounded-full font-medium">Encerrado</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-3">
                    <li>Gerentes e Admins podem aprovar ou rejeitar</li>
                    <li>Contratos aprovados nao podem ser editados nem excluidos</li>
                    <li>Contratos aprovados/ativos podem gerar lancamentos financeiros</li>
                </ul>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Gerar Lancamentos Financeiros
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
                Quando uma venda e aprovada, o botao
                {' '}
                <strong>&quot;Gerar Lancamentos&quot;</strong>
                {' '}
                fica disponivel:
            </p>
            <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-income/10 rounded-lg border border-income/20">
                    <CheckCircle2 className="w-5 h-5 text-income shrink-0" />
                    <div>
                        <h4 className="font-medium text-foreground">Parcelas de Receita</h4>
                        <p className="text-sm text-muted-foreground">
                            Calculadas com base no periodo, recorrencia e dia de vencimento.
                            Com taxa de juros, o calculo usa a Tabela Price (PMT).
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-expense/10 rounded-lg border border-expense/20">
                    <AlertCircle className="w-5 h-5 text-expense shrink-0" />
                    <div>
                        <h4 className="font-medium text-foreground">Despesas (Custos)</h4>
                        <p className="text-sm text-muted-foreground">
                            Taxas do produto (cadastro, operacao, seguro) e comissao do vendedor
                            sao geradas como lancamentos de despesa.
                        </p>
                    </div>
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
                Um dialog de confirmacao mostra o resumo antes de gerar.
                O botao fica desabilitado apos a geracao para evitar duplicatas.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos e Templates
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Upload de arquivos (PDF, imagens, etc.)</li>
                <li>Download dos documentos anexados</li>
                <li>
                    Exportacao em PDF usando
                    {' '}
                    <strong>templates personalizados</strong>
                    {' '}
                    com variaveis dinamicas
                </li>
                <li>
                    Acesse
                    {' '}
                    <strong>Vendas &rarr; Templates</strong>
                    {' '}
                    para gerenciar modelos de contrato
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Resumo</h3>
            <p className="text-sm text-muted-foreground">
                Cards com total de vendas, ativas, pendentes e valor acumulado.
                Filtre por produto e pesquise por titulo.
            </p>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Ao selecionar um vendedor, a categoria e automaticamente
                            definida como &quot;Vendas&quot; e o campo tipo se torna
                            um select de produtos ativos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
