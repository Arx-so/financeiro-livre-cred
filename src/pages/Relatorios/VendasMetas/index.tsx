import {
    ShoppingCart,
    Users,
    Package,
    Target,
    TrendingUp,
    Award,
    Building2,
} from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    VendasVendedor,
    VendasQuantidade,
    VendasValor,
    VendasProduto,
    MetaRealizado,
    MetaIndividual,
    MetaEquipe,
    MetaUnidade,
    ContratosFechados,
    ContratosVendedor,
    ContratosCanal,
    ContratosProduto,
    RankingVendas,
} from './sections';

interface ReportSection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

const sections: ReportSection[] = [
    {
        id: 'vendas-vendedor',
        title: 'Vendas por Vendedor',
        icon: Users,
        component: VendasVendedor,
    },
    {
        id: 'vendas-quantidade',
        title: 'Vendas - Quantidade',
        icon: Package,
        component: VendasQuantidade,
    },
    {
        id: 'vendas-valor',
        title: 'Vendas - Valor',
        icon: TrendingUp,
        component: VendasValor,
    },
    {
        id: 'vendas-produto',
        title: 'Vendas - Produto',
        icon: Package,
        component: VendasProduto,
    },
    {
        id: 'meta-realizado',
        title: 'Meta × Realizado',
        icon: Target,
        component: MetaRealizado,
    },
    {
        id: 'meta-individual',
        title: 'Meta × Realizado - Individual',
        icon: Target,
        component: MetaIndividual,
    },
    {
        id: 'meta-equipe',
        title: 'Meta × Realizado - Equipe',
        icon: Building2,
        component: MetaEquipe,
    },
    {
        id: 'meta-unidade',
        title: 'Meta × Realizado - Unidade',
        icon: Building2,
        component: MetaUnidade,
    },
    {
        id: 'contratos-fechados',
        title: 'Contratos Fechados',
        icon: ShoppingCart,
        component: ContratosFechados,
    },
    {
        id: 'contratos-vendedor',
        title: 'Contratos Fechados - Por Vendedor',
        icon: Users,
        component: ContratosVendedor,
    },
    {
        id: 'contratos-canal',
        title: 'Contratos Fechados - Por Canal',
        icon: ShoppingCart,
        component: ContratosCanal,
    },
    {
        id: 'contratos-produto',
        title: 'Contratos Fechados - Por Produto',
        icon: Package,
        component: ContratosProduto,
    },
    {
        id: 'ranking-vendas',
        title: 'Ranking de Vendas',
        icon: Award,
        component: RankingVendas,
    },
];

export default function RelatoriosVendasMetas() {
    const [activeSection, setActiveSection] = useState('vendas-vendedor');

    const activeReport = sections.find((s) => s.id === activeSection);
    const ActiveComponent = activeReport?.component;

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0">
                    <div className="card-financial p-4 sticky top-20">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Vendas e Metas
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
