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
    DollarSign,
    Receipt,
} from 'lucide-react';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
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
                name: 'Produtos',
                href: '/produtos',
                icon: Package,
                roles: ['admin', 'gerente', 'vendas'],
            },
            {
                name: 'Tabelas de Preços',
                href: '/tabelas-precos',
                icon: DollarSign,
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
            {
                name: 'Usuários',
                href: '/usuarios',
                icon: UserCog,
                roles: ['admin'],
            },
            {
                name: 'Folha de Pagamento',
                href: '/folha-pagamento',
                icon: Receipt,
                roles: ['admin', 'gerente', 'financeiro'],
            },
        ],
    },
    {
        label: 'Análises',
        items: [
            {
                name: 'Relatórios',
                href: '/relatorios',
                icon: BarChart3,
                // All roles can view reports (with varying levels of detail)
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
                                    <span className="truncate font-semibold">FinControl</span>
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

            {/* Navigation */}
            <SidebarContent>
                {navigationGroups.map((group) => {
                    const visibleItems = group.items.filter(canAccessItem);
                    if (visibleItems.length === 0) return null;

                    return (
                        <SidebarGroup key={group.label}>
                            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
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
                                                    <Link to={item.href}>
                                                        <item.icon />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}

                {/* Help Link */}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Ajuda">
                                    <Link to="/docs">
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
                                <DropdownMenuItem>
                                    <User className="mr-2 size-4" />
                                    Meu Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 size-4" />
                                    Configurações
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
        </Sidebar>
    );
}
