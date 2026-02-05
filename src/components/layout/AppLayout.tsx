import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface AppLayoutProps {
    children: ReactNode;
}

const routeNames: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/financeiro': 'Lançamentos',
    '/programacao': 'Programação',
    '/conciliacao': 'Conciliação',
    '/planejamento': 'Orçamento',
    '/previsao': 'Previsão',
    '/cadastros': 'Clientes/Fornecedores',
    '/vendas': 'Vendas',
    '/agenda': 'Agenda',
    '/relatorios': 'Relatórios',
    '/relatorios/executivos': 'Relatórios Executivos',
    '/relatorios/financeiros': 'Relatórios Financeiros',
    '/relatorios/vendas-metas': 'Vendas e Metas',
    '/relatorios/clientes': 'Relatórios de Clientes',
    '/relatorios/recursos-humanos': 'Recursos Humanos',
    '/relatorios/operacoes-compliance': 'Operações e Compliance',
    '/relatorios/marketing-canais': 'Marketing e Canais',
    '/relatorios/estrategicos': 'Relatórios Estratégicos',
    '/docs': 'Documentação',
};

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const currentRouteName = routeNames[location.pathname] || 'Página';

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {/* Top Header Bar */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                    <div className="flex flex-1 items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink asChild>
                                        <Link to="/dashboard">FinControl</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{currentRouteName}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <NotificationBell />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 min-w-0">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
