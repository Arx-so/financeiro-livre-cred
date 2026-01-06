import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAuthStore, useBranchStore } from "@/stores";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Financeiro from "./pages/Financeiro";
import Cadastros from "./pages/Cadastros";
import Relatorios from "./pages/Relatorios";
import Planejamento from "./pages/Planejamento";
import Programacao from "./pages/Programacao";
import Previsao from "./pages/Previsao";
import Conciliacao from "./pages/Conciliacao";
import Contratos from "./pages/Contratos";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

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
      
      {/* Root redirect - goes to dashboard if authenticated, login if not */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Protected routes - only accessible when authenticated */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
      <Route path="/programacao" element={<ProtectedRoute><Programacao /></ProtectedRoute>} />
      <Route path="/planejamento" element={<ProtectedRoute><Planejamento /></ProtectedRoute>} />
      <Route path="/cadastros" element={<ProtectedRoute><Cadastros /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/previsao" element={<ProtectedRoute><Previsao /></ProtectedRoute>} />
      <Route path="/conciliacao" element={<ProtectedRoute><Conciliacao /></ProtectedRoute>} />
      <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
      <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
      
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
