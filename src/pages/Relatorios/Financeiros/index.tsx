import {
    Wallet,
    Calendar,
    FileText,
    DollarSign,
    TrendingDown,
    Clock,
    Percent,
} from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    FluxoCaixa,
    ContasPagarReceber,
    ReceitaProdutoConvenio,
    RelatorioComissoes,
    InadimplenciaAtrasos,
    ClientesAtraso,
    ValorTotalExposto,
    Aging,
    CustoOperacionalVenda,
    MargemLiquidaContrato,
} from './sections';

interface ReportSection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

const sections: ReportSection[] = [
    {
        id: 'fluxo-caixa',
        title: 'Fluxo de Caixa Diário / Semanal / Mensal',
        icon: Calendar,
        component: FluxoCaixa,
    },
    {
        id: 'contas-pagar-receber',
        title: 'Contas a Pagar e a Receber',
        icon: FileText,
        component: ContasPagarReceber,
    },
    {
        id: 'receita-produto-convenio',
        title: 'Receita por Produto e Convênio',
        icon: DollarSign,
        component: ReceitaProdutoConvenio,
    },
    {
        id: 'relatorio-comissoes',
        title: 'Relatório de Comissões',
        icon: DollarSign,
        component: RelatorioComissoes,
    },
    {
        id: 'inadimplencia-atrasos',
        title: 'Inadimplência e Atrasos',
        icon: TrendingDown,
        component: InadimplenciaAtrasos,
    },
    {
        id: 'clientes-atraso',
        title: 'Clientes em Atraso',
        icon: Clock,
        component: ClientesAtraso,
    },
    {
        id: 'valor-total-exposto',
        title: 'Valor Total Exposto',
        icon: DollarSign,
        component: ValorTotalExposto,
    },
    {
        id: 'aging',
        title: 'Aging (30, 60, 90 dias)',
        icon: Calendar,
        component: Aging,
    },
    {
        id: 'custo-operacional-venda',
        title: 'Custo Operacional por Venda',
        icon: Percent,
        component: CustoOperacionalVenda,
    },
    {
        id: 'margem-liquida-contrato',
        title: 'Margem Líquida por Contrato',
        icon: Percent,
        component: MargemLiquidaContrato,
    },
];

export default function RelatoriosFinanceiros() {
    const [activeSection, setActiveSection] = useState('fluxo-caixa');

    const activeReport = sections.find((s) => s.id === activeSection);
    const ActiveComponent = activeReport?.component;

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0">
                    <div className="card-financial p-4 sticky top-20">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Relatórios Financeiros
                        </h2>
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        activeSection === section.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <section.icon className="w-4 h-4" />
                                    <span className="text-left">{section.title}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 min-w-0">
                    <div className="card-financial p-6">
                        {ActiveComponent && <ActiveComponent />}
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
