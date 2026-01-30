import {
    TrendingUp,
    BarChart3,
    DollarSign,
    Percent,
    Target,
    FileText,
    Calendar,
    TrendingDown,
} from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    DashboardGeral,
    Faturamento,
    MargemProduto,
    TicketMedio,
    ResultadoOperacional,
    ReceitaProduto,
    CustosFixosVariaveis,
    Comissoes,
    LucroOperacional,
    ComparativoMensal,
    PrevistoRealizado,
    CrescimentoRetracao,
} from './sections';

interface ReportSection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

const sections: ReportSection[] = [
    {
        id: 'dashboard-geral',
        title: 'Dashboard Geral do Negócio',
        icon: BarChart3,
        component: DashboardGeral,
    },
    {
        id: 'faturamento',
        title: 'Faturamento Bruto e Líquido',
        icon: DollarSign,
        component: Faturamento,
    },
    {
        id: 'margem-produto',
        title: 'Margem por Produto',
        icon: Percent,
        component: MargemProduto,
    },
    {
        id: 'ticket-medio',
        title: 'Ticket Médio',
        icon: Target,
        component: TicketMedio,
    },
    {
        id: 'resultado-operacional',
        title: 'Resultado Operacional (DRE Gerencial)',
        icon: FileText,
        component: ResultadoOperacional,
    },
    {
        id: 'receita-produto',
        title: 'Receita por Produto',
        icon: TrendingUp,
        component: ReceitaProduto,
    },
    {
        id: 'custos-fixos-variaveis',
        title: 'Custos Fixos e Variáveis',
        icon: TrendingDown,
        component: CustosFixosVariaveis,
    },
    {
        id: 'comissoes',
        title: 'Comissões',
        icon: DollarSign,
        component: Comissoes,
    },
    {
        id: 'lucro-operacional',
        title: 'Lucro Operacional',
        icon: TrendingUp,
        component: LucroOperacional,
    },
    {
        id: 'comparativo-mensal',
        title: 'Comparativo Mensal / Trimestral / Anual',
        icon: Calendar,
        component: ComparativoMensal,
    },
    {
        id: 'previsto-realizado',
        title: 'Previsto × Realizado',
        icon: Target,
        component: PrevistoRealizado,
    },
    {
        id: 'crescimento-retracao',
        title: 'Crescimento ou Retração (%)',
        icon: TrendingUp,
        component: CrescimentoRetracao,
    },
];

export default function RelatoriosExecutivos() {
    const [activeSection, setActiveSection] = useState('dashboard-geral');

    const activeReport = sections.find((s) => s.id === activeSection);
    const ActiveComponent = activeReport?.component;

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0">
                    <div className="card-financial p-4 sticky top-20">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Relatórios Executivos
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
