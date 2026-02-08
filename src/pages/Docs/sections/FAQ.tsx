export function FAQ() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Duvidas Frequentes</h2>

            <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como criar um lancamento recorrente?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Financeiro &rarr; Novo Lancamento</li>
                        <li>Marque &quot;Lancamento recorrente&quot;</li>
                        <li>Configure tipo, dia e periodo</li>
                        <li>Salve - o sistema criara 12 lancamentos automaticamente</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como gerar lancamentos financeiros de uma venda?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Crie uma venda com produto, vendedor e periodo definidos</li>
                        <li>Envie para aprovacao e aprove o contrato</li>
                        <li>No card da venda aprovada, clique em &quot;Gerar Lancamentos&quot;</li>
                        <li>Confira o resumo (parcelas de receita + despesas) e confirme</li>
                        <li>Os lancamentos serao criados no modulo Financeiro</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como funciona a Tabela Price nos juros?</h4>
                    <p className="text-sm text-muted-foreground">
                        Quando uma venda possui taxa de juros, o valor das parcelas e calculado
                        usando a formula PMT da Tabela Price. O valor total com juros e maior
                        que o valor original, e cada parcela tem o mesmo valor fixo.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como gerar financeiro de uma comissao?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Planejamento &rarr; aba Comissoes</li>
                        <li>Selecione o mes desejado</li>
                        <li>Na linha do vendedor, clique em &quot;Gerar Financeiro&quot;</li>
                        <li>Uma despesa sera criada com o valor total (comissao + bonus)</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como criar um produto com regras?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Produtos &rarr; Novo Produto</li>
                        <li>Preencha dados basicos, categoria e status</li>
                        <li>Defina limites de valor e prazo (min/max)</li>
                        <li>Configure taxas (cadastro, operacao, seguro, IOF)</li>
                        <li>Configure comissao (fixa ou percentual)</li>
                        <li>As regras serao validadas automaticamente nas vendas</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como criar um orcamento?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Planejamento &rarr; aba Orcamento</li>
                        <li>Crie uma versao de orcamento (ou use a versao padrao)</li>
                        <li>Clique em &quot;Novo Orcamento&quot; e selecione categoria e valor anual</li>
                        <li>O valor e distribuido igualmente nos 12 meses</li>
                        <li>Edite valores mensais individualmente na tabela</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como importar um extrato bancario?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Conciliacao Bancaria</li>
                        <li>Selecione a conta</li>
                        <li>Clique em &quot;Importar Extrato&quot;</li>
                        <li>Selecione arquivo .xlsx ou .csv</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como ver lancamentos de meses anteriores?</h4>
                    <p className="text-sm text-muted-foreground">
                        No modulo Financeiro, use o seletor de mes ou clique em &quot;Todos&quot;
                        para ver todos os periodos.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como exportar relatorios?</h4>
                    <p className="text-sm text-muted-foreground">
                        Em cada modulo ha botoes de &quot;Exportar&quot; para gerar arquivos Excel, CSV ou PDF.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como alterar minha filial?</h4>
                    <p className="text-sm text-muted-foreground">
                        Use o seletor de filial no canto superior da tela para alternar entre
                        as unidades disponiveis. O codigo da filial atual e exibido em destaque.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como cadastrar dados bancarios de um cliente?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Cadastros &rarr; Favorecidos</li>
                        <li>Edite o cadastro do cliente</li>
                        <li>Na secao &quot;Dados Bancarios&quot;, preencha banco, conta e/ou chave PIX</li>
                        <li>Salve o cadastro</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                        Como ver o historico de atividades de um cliente?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        Abra o cadastro do cliente em modo de edicao.
                        Na secao &quot;Historico de Atividades&quot;
                        voce vera todas as acoes realizadas, incluindo quem fez e quando.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como criar um lembrete na agenda?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse a pagina Agenda</li>
                        <li>Clique em &quot;Novo Evento&quot; ou clique em uma data</li>
                        <li>Escolha o tipo &quot;Lembrete&quot;</li>
                        <li>Preencha titulo, data e descricao</li>
                        <li>Defina quantos dias antes deseja ser notificado</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como gerenciar usuarios do sistema?</h4>
                    <p className="text-sm text-muted-foreground">
                        Apenas administradores podem gerenciar usuarios.
                        Acesse Cadastros &rarr; Usuarios para visualizar todos os usuarios,
                        alterar funcoes e definir quais filiais cada um pode acessar.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como gerar folha de pagamento?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Folha de Pagamento &rarr; Nova Folha</li>
                        <li>Selecione o funcionario (favorecido tipo &quot;Funcionario&quot;)</li>
                        <li>Preencha salario, horas extras, beneficios e descontos</li>
                        <li>O salario liquido e calculado automaticamente</li>
                        <li>Use &quot;Gerar Lancamento&quot; para criar a despesa no financeiro</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
