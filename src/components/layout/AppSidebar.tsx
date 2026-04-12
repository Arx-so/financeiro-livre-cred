import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    Calendar,
    Users,
    BarChart3,
    TrendingUp,
    Building2,
    FileText,
    LogOut,
    Settings,
    User,
    HelpCircle,
    ChevronsUpDown,
    CheckCircle2,
    Tag,
    Landmark,
    UserCog,
    Store,
    Package,
    ShoppingCart,
    Receipt,
    Shield,
    Megaphone,
    Brain,
    UserCheck,
    HardHat,
    Bus,
    Stethoscope,
    ClipboardList,
    Banknote,
    Cake,
} from 'lucide-react';
import { useAuthStore, useBranchStore } from '@/stores';
import { ProfileModal } from './ProfileModal';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { UserRole } from '@/types/database';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: UserRole[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navigationGroups: NavGroup[] = [
    {
        label: 'Principal',
        items: [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                // All roles can view dashboard
            },
            {
                name: 'Agenda',
                href: '/agenda',
                icon: Calendar,
                // All roles can view agenda
            },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            {
                name: 'Lançamentos',
                href: '/financeiro',
                icon: Wallet,
                roles: ['admin', 'gerente', 'usuario', 'financeiro'],
            },
            {
                name: 'Programação',
                href: '/programacao',
                icon: Calendar,
                roles: ['admin', 'gerente', 'usuario', 'financeiro'],
            },
            {
                name: 'Conciliação',
                href: '/conciliacao',
                icon: Building2,
                roles: ['admin', 'gerente', 'financeiro'],
            },
        ],
    },
    {
        label: 'Planejamento',
        items: [
            {
                name: 'Orçamento',
                href: '/planejamento',
                icon: TrendingUp,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Previsão',
                href: '/previsao',
                icon: TrendingUp,
                roles: ['admin', 'gerente', 'financeiro', 'leitura'],
            },
        ],
    },
    {
        label: 'Vendas',
        items: [
            {
                name: 'Vendas',
                href: '/vendas',
                icon: ShoppingCart,
                roles: ['admin', 'gerente', 'usuario', 'vendas'],
            },
            {
                name: 'Cartão / D+',
                href: '/vendas/novo',
                icon: Banknote,
                roles: ['admin', 'gerente', 'usuario', 'vendas'],
            },
            {
                name: 'Relatório de Vendas',
                href: '/vendas/relatorio',
                icon: BarChart3,
                roles: ['admin', 'gerente', 'usuario', 'vendas', 'financeiro'],
            },
            {
                name: 'Produtos',
                href: '/produtos',
                icon: Package,
                roles: ['admin', 'gerente', 'vendas'],
            },
        ],
    },
    {
        label: 'Cadastros',
        items: [
            {
                name: 'Favorecidos',
                href: '/favorecidos',
                icon: Users,
                roles: ['admin', 'gerente', 'usuario', 'financeiro', 'vendas'],
            },
            {
                name: 'Categorias',
                href: '/categorias',
                icon: Tag,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Contas Bancárias',
                href: '/contas-bancarias',
                icon: Landmark,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Filiais',
                href: '/filiais',
                icon: Store,
                roles: ['admin'],
            },
        ],
    },
    {
        label: 'Recursos Humanos',
        items: [
            {
                name: 'Dashboard RH',
                href: '/rh',
                icon: LayoutDashboard,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Funcionários',
                href: '/funcionarios',
                icon: HardHat,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Folha de Pagamento',
                href: '/folha-pagamento',
                icon: Receipt,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Férias',
                href: '/rh/ferias',
                icon: Calendar,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Exames Ocupacionais',
                href: '/rh/exames',
                icon: Stethoscope,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Vale Transporte',
                href: '/rh/vale-transporte',
                icon: Bus,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Calendário',
                href: '/rh/calendario',
                icon: Calendar,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Atestados',
                href: '/rh/atestados',
                icon: ClipboardList,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Aniversários',
                href: '/rh/aniversarios',
                icon: Cake,
                roles: ['admin', 'gerente', 'financeiro'],
            },
            {
                name: 'Usuários',
                href: '/usuarios',
                icon: UserCog,
                roles: ['admin'],
            },
        ],
    },
    {
        label: 'Análises',
        items: [
            {
                name: 'Relatórios Executivos',
                href: '/relatorios/executivos',
                icon: TrendingUp,
                // All roles can view reports (with varying levels of detail)
            },
            {
                name: 'Relatórios Financeiros',
                href: '/relatorios/financeiros',
                icon: Wallet,
            },
            {
                name: 'Vendas e Metas',
                href: '/relatorios/vendas-metas',
                icon: ShoppingCart,
            },
            {
                name: 'Relatórios de Clientes',
                href: '/relatorios/clientes',
                icon: UserCheck,
            },
            {
                name: 'Recursos Humanos',
                href: '/relatorios/recursos-humanos',
                icon: UserCog,
            },
            {
                name: 'Operações e Compliance',
                href: '/relatorios/operacoes-compliance',
                icon: Shield,
            },
            {
                name: 'Marketing e Canais',
                href: '/relatorios/marketing-canais',
                icon: Megaphone,
            },
            {
                name: 'Relatórios Estratégicos',
                href: '/relatorios/estrategicos',
                icon: Brain,
            },
        ],
    },
];

export function AppSidebar() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const unidades = useBranchStore((state) => state.unidades);
    const setUnidadeAtual = useBranchStore((state) => state.setUnidadeAtual);

    const location = useLocation();
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Abre o accordion da seção que contém a rota atual; apenas um aberto por vez
    const activeGroupLabel = navigationGroups.find((g) => g.items.some((i) => i.href === location.pathname),)?.label;
    const [openSection, setOpenSection] = useState<string | undefined>(activeGroupLabel);

    useEffect(() => {
        if (activeGroupLabel) setOpenSection(activeGroupLabel);
    }, [location.pathname, activeGroupLabel]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getInitials = (name: string) => name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Filter items based on user role
    const canAccessItem = (item: NavItem): boolean => {
        if (!item.roles) return true;
        if (!user?.role) return false;
        return item.roles.includes(user.role);
    };

    return (
        <Sidebar collapsible="icon" className="border-r-0">
            {/* Header with Logo */}
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            asChild
                        >
                            <Link to="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Wallet className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">LivreCred</span>
                                    <span className="truncate text-xs text-sidebar-foreground/70">
                                        Gestão Financeira
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Branch Selector */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                                        <Building2 className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {unidadeAtual?.name || 'Selecione'}
                                        </span>
                                        <span className="truncate text-xs text-sidebar-foreground/70">
                                            {unidadeAtual?.code || 'Filial'}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                align="start"
                                side="bottom"
                                sideOffset={4}
                            >
                                {unidades.map((unidade) => (
                                    <DropdownMenuItem
                                        key={unidade.id}
                                        onClick={() => setUnidadeAtual(unidade)}
                                        className="gap-2 p-2"
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-sm border">
                                            <Building2 className="size-3.5 shrink-0" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-medium">{unidade.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {unidade.code}
                                            </span>
                                        </div>
                                        {unidadeAtual?.id === unidade.id && (
                                            <CheckCircle2 className="size-4 text-primary" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Navigation - accordion: uma seção aberta por vez, sem scroll */}
            <SidebarContent>
                <Accordion
                    type="single"
                    collapsible
                    value={openSection ?? ''}
                    onValueChange={(v) => setOpenSection(v || undefined)}
                    className="flex flex-col gap-0 border-0"
                >
                    {navigationGroups.map((group) => {
                        const visibleItems = group.items.filter(canAccessItem);
                        if (visibleItems.length === 0) return null;

                        return (
                            <AccordionItem
                                key={group.label}
                                value={group.label}
                                className="border-b-0 border-sidebar-border/50 last:border-0"
                            >
                                <AccordionTrigger className="flex h-8 shrink-0 items-center rounded-md px-2 py-0 text-xs font-medium text-sidebar-foreground/70 hover:no-underline hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:size-4 group-data-[collapsible=icon]:hidden">
                                    <span className="flex-1 text-left">{group.label}</span>
                                </AccordionTrigger>
                                <AccordionContent className="overflow-hidden pb-1 pt-0">
                                    <SidebarGroupContent>
                                        <SidebarMenu>
                                            {visibleItems.map((item) => {
                                                const isActive = location.pathname === item.href;
                                                return (
                                                    <SidebarMenuItem key={item.name}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={isActive}
                                                            tooltip={item.name}
                                                        >
                                                            <Link to={item.href} preventScrollReset>
                                                                <item.icon />
                                                                <span>{item.name}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            })}
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>

                {/* Help Link */}
                <SidebarGroup className="mt-auto border-t border-sidebar-border/50 pt-2">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Ajuda">
                                    <Link to="/docs" preventScrollReset>
                                        <HelpCircle />
                                        <span>Documentação</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer with User Menu */}
            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                                            {user?.name ? getInitials(user.name) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.name}</span>
                                        <span className="truncate text-xs text-sidebar-foreground/70">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            {user?.name ? getInitials(user.name) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.email}
                                        </span>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                                    <User className="mr-2 size-4" />
                                    Meu Perfil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />

            <ProfileModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
        </Sidebar>
    );
}
