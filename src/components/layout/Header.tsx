import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Calendar, 
  Users, 
  FolderOpen,
  BarChart3, 
  TrendingUp, 
  Building2,
  FileText,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore, useBranchStore } from '@/stores';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const navigationGroups = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Financeiro',
    icon: Wallet,
    items: [
      { name: 'Lançamentos', href: '/financeiro', icon: Wallet },
      { name: 'Programação', href: '/programacao', icon: Calendar },
      { name: 'Conciliação', href: '/conciliacao', icon: Building2 },
    ],
  },
  {
    name: 'Planejamento',
    icon: TrendingUp,
    items: [
      { name: 'Orçamento', href: '/planejamento', icon: TrendingUp },
      { name: 'Previsão', href: '/previsao', icon: TrendingUp },
    ],
  },
  {
    name: 'Cadastros',
    icon: FolderOpen,
    items: [
      { name: 'Clientes/Fornecedores', href: '/cadastros', icon: Users },
      { name: 'Contratos', href: '/contratos', icon: FileText },
    ],
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
  },
];

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const unidades = useBranchStore((state) => state.unidades);
  const setUnidadeAtual = useBranchStore((state) => state.setUnidadeAtual);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">FinControl</h1>
              <p className="text-xs text-muted-foreground">Gestão Financeira</p>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Unit Selector */}
            <Select
              value={unidadeAtual?.id || ''}
              onValueChange={(value) => {
                const unidade = unidades.find(u => u.id === value);
                if (unidade) setUnidadeAtual(unidade);
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Selecione a filial" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors">
              <Search className="w-4 h-4" />
              <span>Buscar...</span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-card px-1.5 font-mono text-xs text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu button */}
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navigationGroups.map((group) => {
                if (group.href) {
                  const isActive = location.pathname === group.href;
                  return (
                    <Link
                      key={group.name}
                      to={group.href}
                      className={isActive ? 'nav-item-active' : 'nav-item'}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <group.icon className="w-4 h-4" />
                      <span>{group.name}</span>
                    </Link>
                  );
                }
                
                return (
                  <div key={group.name} className="space-y-1">
                    <div className="nav-item font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      <group.icon className="w-4 h-4" />
                      <span>{group.name}</span>
                    </div>
                    <div className="pl-6 flex flex-col gap-1">
                      {group.items?.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={isActive ? 'nav-item-active' : 'nav-item'}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
