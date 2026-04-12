import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    BrowserRouter, Routes, Route, Navigate
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore, useBranchStore } from "@/stores";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Financeiro from "./pages/Financeiro";
import FinanceiroDetalhe from "./pages/Financeiro/FinanceiroDetalhe";
import Favorecidos from "./pages/Favorecidos";
import Categorias from "./pages/Categorias";
import ContasBancarias from "./pages/ContasBancarias";
import Filiais from "./pages/Filiais";
import Usuarios from "./pages/Usuarios";
import Relatorios from "./pages/Relatorios";
import RelatoriosExecutivos from "./pages/Relatorios/Executivos";
import RelatoriosFinanceiros from "./pages/Relatorios/Financeiros";
import RelatoriosVendasMetas from "./pages/Relatorios/VendasMetas";
import RelatoriosClientes from "./pages/Relatorios/Clientes";
import RelatoriosRecursosHumanos from "./pages/Relatorios/RecursosHumanos";
import RelatoriosOperacoesCompliance from "./pages/Relatorios/OperacoesCompliance";
import RelatoriosMarketingCanais from "./pages/Relatorios/MarketingCanais";
import RelatoriosEstrategicos from "./pages/Relatorios/Estrategicos";
import Planejamento from "./pages/Planejamento";
import Programacao from "./pages/Programacao";
import Previsao from "./pages/Previsao";
import Conciliacao from "./pages/Conciliacao";
import Contratos from "./pages/Contratos";
import ContractTemplates from "./pages/Contratos/Templates";
import Produtos from "./pages/Produtos";
import FolhaPagamento from "./pages/FolhaPagamento";
import Funcionarios from "./pages/Funcionarios";
import Agenda from "./pages/Agenda";
import Docs from "./pages/Docs";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import RhDashboard from "./pages/RH";
import RhFerias from "./pages/RH/Ferias";
import RhExames from "./pages/RH/Exames";
import RhValeTransporte from "./pages/RH/ValeTransporte";
import RhCalendario from "./pages/RH/Calendario";
import RhAtestados from "./pages/RH/Atestados";
import RhAniversarios from "./pages/RH/Aniversarios";
import VendasNovo from "./pages/Vendas";
import RelatorioVendas from "./pages/Vendas/RelatorioVendas";

const queryClient = new QueryClient();

// Loading spinner component
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// Protected route - redirects to /login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

    if (!isInitialized || isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Public route - redirects to /dashboard if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

    if (!isInitialized || isLoading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

// Auth initializer component
function AuthInitializer({ children }: { children: React.ReactNode }) {
    const initialize = useAuthStore((state) => state.initialize);
    const user = useAuthStore((state) => state.user);
    const loadBranches = useBranchStore((state) => state.loadBranches);
    const clearBranches = useBranchStore((state) => state.clearBranches);

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Load branches when user changes
    useEffect(() => {
        if (user) {
            loadBranches(user.id, user.role);
        } else {
            clearBranches();
        }
    }, [user, loadBranches, clearBranches]);

    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public routes - only accessible when NOT authenticated */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Root redirect - goes to dashboard if authenticated, login if not */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected routes - only accessible when authenticated */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
            <Route path="/financeiro/:id" element={<ProtectedRoute><FinanceiroDetalhe /></ProtectedRoute>} />
            <Route path="/programacao" element={<ProtectedRoute><Programacao /></ProtectedRoute>} />
            <Route path="/planejamento" element={<ProtectedRoute><Planejamento /></ProtectedRoute>} />
            <Route path="/favorecidos" element={<ProtectedRoute><Favorecidos /></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
            <Route path="/contas-bancarias" element={<ProtectedRoute><ContasBancarias /></ProtectedRoute>} />
            <Route path="/filiais" element={<ProtectedRoute><Filiais /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/relatorios" element={<Navigate to="/relatorios/executivos" replace />} />
            <Route path="/relatorios/executivos" element={<ProtectedRoute><RelatoriosExecutivos /></ProtectedRoute>} />
            <Route path="/relatorios/financeiros" element={<ProtectedRoute><RelatoriosFinanceiros /></ProtectedRoute>} />
            <Route path="/relatorios/vendas-metas" element={<ProtectedRoute><RelatoriosVendasMetas /></ProtectedRoute>} />
            <Route path="/relatorios/clientes" element={<ProtectedRoute><RelatoriosClientes /></ProtectedRoute>} />
            <Route path="/relatorios/recursos-humanos" element={<ProtectedRoute><RelatoriosRecursosHumanos /></ProtectedRoute>} />
            <Route path="/relatorios/operacoes-compliance" element={<ProtectedRoute><RelatoriosOperacoesCompliance /></ProtectedRoute>} />
            <Route path="/relatorios/marketing-canais" element={<ProtectedRoute><RelatoriosMarketingCanais /></ProtectedRoute>} />
            <Route path="/relatorios/estrategicos" element={<ProtectedRoute><RelatoriosEstrategicos /></ProtectedRoute>} />
            <Route path="/previsao" element={<ProtectedRoute><Previsao /></ProtectedRoute>} />
            <Route path="/conciliacao" element={<ProtectedRoute><Conciliacao /></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
            <Route path="/vendas/templates" element={<ProtectedRoute><ContractTemplates /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
            <Route path="/folha-pagamento" element={<ProtectedRoute><FolhaPagamento /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />

            {/* RH module */}
            <Route path="/rh" element={<ProtectedRoute><RhDashboard /></ProtectedRoute>} />
            <Route path="/rh/ferias" element={<ProtectedRoute><RhFerias /></ProtectedRoute>} />
            <Route path="/rh/exames" element={<ProtectedRoute><RhExames /></ProtectedRoute>} />
            <Route path="/rh/vale-transporte" element={<ProtectedRoute><RhValeTransporte /></ProtectedRoute>} />
            <Route path="/rh/calendario" element={<ProtectedRoute><RhCalendario /></ProtectedRoute>} />
            <Route path="/rh/atestados" element={<ProtectedRoute><RhAtestados /></ProtectedRoute>} />
            <Route path="/rh/aniversarios" element={<ProtectedRoute><RhAniversarios /></ProtectedRoute>} />

            {/* Vendas — new sales dashboard */}
            <Route path="/vendas/novo" element={<ProtectedRoute><VendasNovo /></ProtectedRoute>} />
            <Route path="/vendas/relatorio" element={<ProtectedRoute><RelatorioVendas /></ProtectedRoute>} />

            {/* 404 - Protected to prevent information leak */}
            <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
        </Routes>
    );
}

// Root redirect component
function RootRedirect() {
    const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

    if (!isInitialized || isLoading) {
        return <LoadingScreen />;
    }

    return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <AuthInitializer>
                        <AppRoutes />
                    </AuthInitializer>
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;
