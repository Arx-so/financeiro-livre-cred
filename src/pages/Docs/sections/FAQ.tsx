export function FAQ() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dúvidas Frequentes</h2>

            <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como criar um lançamento recorrente?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Financeiro → Novo Lançamento</li>
                        <li>Marque &quot;Lançamento recorrente&quot;</li>
                        <li>Configure tipo, dia e período</li>
                        <li>Salve - o sistema criará 12 lançamentos automaticamente</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como importar um extrato bancário?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Conciliação Bancária</li>
                        <li>Selecione a conta</li>
                        <li>Clique em &quot;Importar Extrato&quot;</li>
                        <li>Selecione arquivo .xlsx ou .csv</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como ver lançamentos de meses anteriores?</h4>
                    <p className="text-sm text-muted-foreground">
                        No módulo Financeiro, use o seletor de mês ou clique em &quot;Todos&quot;
                        para ver todos os períodos.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como exportar relatórios?</h4>
                    <p className="text-sm text-muted-foreground">
                        Em cada módulo há botões de &quot;Exportar&quot; para gerar arquivos Excel, CSV ou PDF.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como alterar minha filial?</h4>
                    <p className="text-sm text-muted-foreground">
                        Use o seletor de filial no canto superior da tela para alternar entre
                        as unidades disponíveis. O código da filial atual é exibido em destaque.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como cadastrar dados bancários de um cliente?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse Cadastros → Favorecidos</li>
                        <li>Edite o cadastro do cliente</li>
                        <li>Na seção &quot;Dados Bancários&quot;, preencha banco, conta e/ou chave PIX</li>
                        <li>Salve o cadastro</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                        Como ver o histórico de atividades de um cliente?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        Abra o cadastro do cliente em modo de edição.
                        Na seção &quot;Histórico de Atividades&quot;
                        você verá todas as ações realizadas, incluindo quem fez e quando.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como criar um lembrete na agenda?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Acesse a página Agenda</li>
                        <li>Clique em &quot;Novo Evento&quot; ou clique em uma data</li>
                        <li>Escolha o tipo &quot;Lembrete&quot;</li>
                        <li>Preencha título, data e descrição</li>
                        <li>Defina quantos dias antes deseja ser notificado</li>
                    </ol>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como gerenciar usuários do sistema?</h4>
                    <p className="text-sm text-muted-foreground">
                        Apenas administradores podem gerenciar usuários.
                        Acesse Cadastros → Usuários para visualizar todos os usuários,
                        alterar funções e definir quais filiais cada um pode acessar.
                    </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Como funciona o aniversário automático?</h4>
                    <p className="text-sm text-muted-foreground">
                        Quando você cadastra a data de nascimento de um cliente, o aniversário dele
                        aparece automaticamente no calendário da Agenda com um ícone de bolo 🎂.
                    </p>
                </div>
            </div>
        </div>
    );
}
