import { Lightbulb } from 'lucide-react';

export function Relatorios() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Relatorios</h2>
            <p className="text-muted-foreground">
                O sistema oferece 8 categorias de relatorios para analise completa do negocio.
                Acesse pelo menu lateral e navegue entre as abas.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Categorias de Relatorios</h3>

            <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Executivos</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                        Visao de alto nivel para gestores com indicadores consolidados:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Resumo financeiro geral</li>
                        <li>Receitas e despesas por categoria</li>
                        <li>Analise de comissoes</li>
                        <li>Graficos comparativos</li>
                    </ul>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Financeiros</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                        Relatorios detalhados de operacoes financeiras:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Custo Operacional x Venda</li>
                        <li>Inadimplencia e Atrasos</li>
                        <li>Clientes em Atraso</li>
                        <li>Valor Total Exposto (risco)</li>
                        <li>Receita por Produto/Convenio</li>
                        <li>Aging Report (vencimentos)</li>
                        <li>Margem Liquida por Contrato</li>
                        <li>Fluxo de Caixa</li>
                        <li>Contas a Pagar/Receber</li>
                        <li>Relatorio de Comissoes</li>
                    </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Vendas e Metas</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Vendas vs Metas por vendedor</li>
                            <li>Acompanhamento de comissoes</li>
                            <li>Atingimento de metas</li>
                        </ul>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Clientes</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Top clientes por receita</li>
                            <li>Top fornecedores por despesa</li>
                            <li>Ranking com volume de transacoes</li>
                        </ul>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Recursos Humanos</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Custos com pessoal</li>
                            <li>Resultado de comissoes</li>
                            <li>Metricas de equipe</li>
                        </ul>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Operacoes e Compliance</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Metricas operacionais</li>
                            <li>Indicadores de conformidade</li>
                            <li>Auditoria de processos</li>
                        </ul>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Marketing e Canais</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Origem do Cliente (fonte de aquisicao)</li>
                            <li>Indicadores de Crescimento</li>
                            <li>Analise por canal</li>
                        </ul>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Estrategicos</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Meta vs Risco</li>
                            <li>Caixa Critico (alertas)</li>
                            <li>Vendedor Fora do Padrao</li>
                            <li>Score de Performance do Vendedor</li>
                        </ul>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Filtros</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Periodo:</strong>
                    {' '}
                    Selecione data inicial e final
                </li>
                <li>
                    <strong>Por vendedor, produto ou periodo:</strong>
                    {' '}
                    Filtros especificos por relatorio
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Exportacao</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>PDF:</strong>
                    {' '}
                    Para impressao ou compartilhamento
                </li>
                <li>
                    <strong>Excel:</strong>
                    {' '}
                    Para analises adicionais em planilhas
                </li>
            </ul>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Todos os relatorios sao filtrados pela filial selecionada no topo da pagina.
                            Alterne a filial para ver dados de diferentes unidades.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
