import {
    Megaphone,
    Share2,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    IndicadoresCrescimento,
    OrigemCliente,
} from './sections';

interface ReportSection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

const sections: ReportSection[] = [
    {
        id: 'indicadores-crescimento',
        title: 'Indicadores de Crescimento',
        icon: TrendingUp,
        component: IndicadoresCrescimento,
    },
    {
        id: 'origem-cliente',
        title: 'Origem do Cliente',
        icon: Users,
        component: OrigemCliente,
    },
];

export default function RelatoriosMarketingCanais() {
    const [activeSection, setActiveSection] = useState('indicadores-crescimento');

    const activeReport = sections.find((s) => s.id === activeSection);
    const ActiveComponent = activeReport?.component;

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0">
                    <div className="card-financial p-4 sticky top-20">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Megaphone className="w-5 h-5" />
                            Marketing e Canais
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
