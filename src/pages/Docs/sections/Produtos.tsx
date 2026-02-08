import { Lightbulb } from 'lucide-react';

export function Produtos() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
            <p className="text-muted-foreground">
                Catalogo de produtos com regras de valores, taxas, juros e comissoes.
                Os produtos sao vinculados as vendas e definem as regras do contrato.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Cadastrar Produto</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Clique em
                {' '}
                <strong>&quot;Novo Produto&quot;</strong>
                {' '}
                e preencha as informacoes:
            </p>

            <h4 className="font-medium text-foreground">Dados Basicos</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Nome e Codigo:</strong>
                    {' '}
                    Identificacao do produto
                </li>
                <li>
                    <strong>Descricao:</strong>
                    {' '}
                    Descricao interna e descricao comercial
                </li>
                <li>
                    <strong>Categoria:</strong>
                    {' '}
                    Organizacao por categorias de produtos
                </li>
                <li>
                    <strong>Status:</strong>
                    {' '}
                    Ativo ou Inativo (apenas ativos aparecem nas vendas)
                </li>
                <li>
                    <strong>Tipo de Recorrencia:</strong>
                    {' '}
                    Unico, mensal ou anual
                </li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Valores e Limites</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Valor de Referencia:</strong>
                    {' '}
                    Com percentual banco/empresa
                </li>
                <li>
                    <strong>Valor Minimo e Maximo:</strong>
                    {' '}
                    Faixa permitida para vendas
                </li>
                <li>
                    <strong>Prazo Minimo e Maximo:</strong>
                    {' '}
                    Limite de meses do contrato
                </li>
                <li>
                    <strong>Taxa de Juros Min/Max:</strong>
                    {' '}
                    Faixa de juros permitida (% a.m.)
                </li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Taxas e Custos</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-medium text-foreground">Taxa</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Descricao</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="py-2 px-3 text-foreground">Cadastro</td>
                            <td className="py-2 px-3 text-muted-foreground">Taxa de cadastro/adesao</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Operacao</td>
                            <td className="py-2 px-3 text-muted-foreground">Taxa operacional</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">Seguro</td>
                            <td className="py-2 px-3 text-muted-foreground">Taxa de seguro</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-foreground">IOF</td>
                            <td className="py-2 px-3 text-muted-foreground">Imposto sobre operacoes financeiras</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
                Estas taxas sao geradas automaticamente como despesas ao usar o
                &quot;Gerar Lancamentos&quot; em uma venda aprovada.
            </p>

            <h4 className="font-medium text-foreground mt-4">Comissao</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Tipo:</strong>
                    {' '}
                    Fixa (valor fixo) ou Percentual (% sobre a venda)
                </li>
                <li>
                    <strong>Valor/Percentual:</strong>
                    {' '}
                    Taxa ou valor da comissao
                </li>
                <li>
                    <strong>Minimo e Maximo:</strong>
                    {' '}
                    Limites de comissao
                </li>
                <li>
                    <strong>Recebida por:</strong>
                    {' '}
                    Por produto, por prazo ou por valor
                </li>
                <li>
                    <strong>Dia de Pagamento:</strong>
                    {' '}
                    Dia do mes para pagamento da comissao
                </li>
            </ul>

            <h4 className="font-medium text-foreground mt-4">Outras Configuracoes</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Tipos de Faturamento:</strong>
                    {' '}
                    Boleto, debito, consignado, etc.
                </li>
                <li>
                    <strong>Documentos Obrigatorios:</strong>
                    {' '}
                    Lista de documentos exigidos
                </li>
                <li>
                    <strong>Tipo de Cliente:</strong>
                    {' '}
                    Elegibilidade (PF, PJ, ambos)
                </li>
                <li>
                    <strong>Publico Alvo:</strong>
                    {' '}
                    Segmentacao do produto
                </li>
                <li>
                    <strong>Regras Especificas:</strong>
                    {' '}
                    Notas e regras adicionais
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Categorias de Produtos</h3>
            <p className="text-sm text-muted-foreground">
                Organize seus produtos em categorias para facilitar a gestao.
                Filtre por categoria na listagem de produtos.
            </p>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            As regras do produto (limites de valor, prazo, juros) sao validadas
                            automaticamente no formulario de venda. Um painel de regras e exibido
                            ao selecionar o produto.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
