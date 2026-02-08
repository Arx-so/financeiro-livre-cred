import {
    BookOpen,
    LayoutDashboard,
    Wallet,
    Users,
    Building2,
    BarChart3,
    TrendingUp,
    Calendar,
    HelpCircle,
    Package,
    Target,
    Calculator,
    ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    VisaoGeral,
    Dashboard,
    Financeiro,
    Cadastros,
    Conciliacao,
    Vendas,
    Produtos,
    Planejamento,
    FolhaPagamento,
    Agenda,
    Relatorios,
    Previsao,
    Programacao,
    Permissoes,
    FAQ
} from './sections';

interface DocSection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

const sections: DocSection[] = [
    {
        id: 'visao-geral',
        title: 'Visao Geral',
        icon: BookOpen,
        component: VisaoGeral,
    },
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: LayoutDashboard,
        component: Dashboard,
    },
    {
        id: 'financeiro',
        title: 'Financeiro',
        icon: Wallet,
        component: Financeiro,
    },
    {
        id: 'vendas',
        title: 'Vendas',
        icon: ShoppingCart,
        component: Vendas,
    },
    {
        id: 'produtos',
        title: 'Produtos',
        icon: Package,
        component: Produtos,
    },
    {
        id: 'planejamento',
        title: 'Planejamento',
        icon: Target,
        component: Planejamento,
    },
    {
        id: 'cadastros',
        title: 'Cadastros',
        icon: Users,
        component: Cadastros,
    },
    {
        id: 'folha-pagamento',
        title: 'Folha de Pagamento',
        icon: Calculator,
        component: FolhaPagamento,
    },
    {
        id: 'conciliacao',
        title: 'Conciliacao Bancaria',
        icon: Building2,
        component: Conciliacao,
    },
    {
        id: 'agenda',
        title: 'Agenda',
        icon: Calendar,
        component: Agenda,
    },
    {
        id: 'relatorios',
        title: 'Relatorios',
        icon: BarChart3,
        component: Relatorios,
    },
    {
        id: 'previsao',
        title: 'Previsao de Caixa',
        icon: TrendingUp,
        component: Previsao,
    },
    {
        id: 'programacao',
        title: 'Programacao Financeira',
        icon: Calendar,
        component: Programacao,
    },
    {
        id: 'permissoes',
        title: 'Permissoes',
        icon: Users,
        component: Permissoes,
    },
    {
        id: 'faq',
        title: 'Duvidas Frequentes',
        icon: HelpCircle,
        component: FAQ,
    },
];

export default function Docs() {
    const [activeSection, setActiveSection] = useState('visao-geral');

    const activeDoc = sections.find((s) => s.id === activeSection);
    const ActiveComponent = activeDoc?.component;

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0">
                    <div className="card-financial p-4 sticky top-20">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Documentacao
                        </h2>
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    type="button"
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        activeSection === section.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
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
