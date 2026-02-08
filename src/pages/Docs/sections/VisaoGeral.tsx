import {
    CheckCircle2,
    Building2,
    Repeat,
    BarChart3,
    Lightbulb,
    ShoppingCart,
    Package,
    Target,
    FileText,
    Users,
    Calculator,
} from 'lucide-react';

export function VisaoGeral() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao FinControl!</h2>
            <p className="text-muted-foreground">
                O FinControl é um sistema completo de gestão financeira empresarial que permite controlar
                todas as operações financeiras da sua empresa de forma simples e eficiente.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Principais Funcionalidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-income/10 rounded-lg border border-income/20">
                    <CheckCircle2 className="w-6 h-6 text-income mb-2" />
                    <h4 className="font-semibold text-foreground">Controle de Receitas e Despesas</h4>
                    <p className="text-sm text-muted-foreground">
                        Registre e acompanhe todos os lançamentos financeiros com categorias, subcategorias e filtros
                    </p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <Building2 className="w-6 h-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Multiplas Filiais</h4>
                    <p className="text-sm text-muted-foreground">
                        Gerencie varias unidades em um unico sistema com dados isolados por filial
                    </p>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <ShoppingCart className="w-6 h-6 text-warning mb-2" />
                    <h4 className="font-semibold text-foreground">Vendas e Contratos</h4>
                    <p className="text-sm text-muted-foreground">
                        Gerencie vendas com fluxo de aprovacao, produtos, vendedores e geracao automatica de lancamentos
                    </p>
                </div>
                <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <Package className="w-6 h-6 text-info mb-2" />
                    <h4 className="font-semibold text-foreground">Catalogo de Produtos</h4>
                    <p className="text-sm text-muted-foreground">
                        Cadastre produtos com regras de valores, taxas, juros e comissoes
                    </p>
                </div>
                <div className="p-4 bg-income/10 rounded-lg border border-income/20">
                    <Target className="w-6 h-6 text-income mb-2" />
                    <h4 className="font-semibold text-foreground">Planejamento e Metas</h4>
                    <p className="text-sm text-muted-foreground">
                        Orcamento por categoria, metas de vendas por vendedor e calculo de comissoes
                    </p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <Repeat className="w-6 h-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Lancamentos Recorrentes</h4>
                    <p className="text-sm text-muted-foreground">
                        Automatize despesas e receitas que se repetem (mensal, semanal, anual)
                    </p>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <BarChart3 className="w-6 h-6 text-warning mb-2" />
                    <h4 className="font-semibold text-foreground">Relatorios Completos</h4>
                    <p className="text-sm text-muted-foreground">
                        8 categorias de relatorios: executivos, financeiros, vendas, clientes, RH e mais
                    </p>
                </div>
                <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <Calculator className="w-6 h-6 text-info mb-2" />
                    <h4 className="font-semibold text-foreground">Folha de Pagamento</h4>
                    <p className="text-sm text-muted-foreground">
                        Gestao completa de folha com proventos, beneficios, descontos e integracao financeira
                    </p>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Modulos do Sistema</h3>
            <div className="space-y-2">
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Dashboard</h4>
                        <p className="text-sm text-muted-foreground">
                            Visao consolidada com resumo financeiro, graficos e proximos pagamentos
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Financeiro</h4>
                        <p className="text-sm text-muted-foreground">
                            Contas a pagar e receber, lancamentos recorrentes, filtros avancados
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Vendas e Produtos</h4>
                        <p className="text-sm text-muted-foreground">
                            Contratos, fluxo de aprovacao, templates PDF, geracao de lancamentos financeiros
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Planejamento</h4>
                        <p className="text-sm text-muted-foreground">
                            Orcamento com versoes, metas de vendas, comissoes com geracao de financeiro
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Cadastros</h4>
                        <p className="text-sm text-muted-foreground">
                            Favorecidos, categorias, contas bancarias, filiais, usuarios, folha de pagamento
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Conciliacao Bancaria</h4>
                        <p className="text-sm text-muted-foreground">
                            Importacao de extratos e conciliacao com lancamentos do sistema
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-foreground">Relatorios</h4>
                        <p className="text-sm text-muted-foreground">
                            Executivos, financeiros, vendas/metas, clientes, RH, compliance, marketing, estrategicos
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica: Seletor de Filial</h4>
                        <p className="text-sm text-muted-foreground">
                            Use o seletor no topo da pagina para alternar entre as filiais.
                            Todos os dados exibidos serao filtrados pela unidade selecionada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
