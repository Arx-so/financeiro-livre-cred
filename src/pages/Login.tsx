import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Eye, EyeOff, Loader2, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isSendingReset, setIsSendingReset] = useState(false);

    const login = useAuthStore((state) => state.login);
    const resetPassword = useAuthStore((state) => state.resetPassword);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            toast.success('Login realizado com sucesso!');
            navigate('/dashboard');
        } else {
            toast.error(result.error || 'Email ou senha inválidos');
        }

        setIsLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!forgotEmail) {
            toast.error('Digite seu email');
            return;
        }

        setIsSendingReset(true);

        const result = await resetPassword(forgotEmail);

        if (result.success) {
            toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
            setShowForgotPassword(false);
            setForgotEmail('');
        } else {
            toast.error(result.error || 'Erro ao enviar email de recuperação');
        }

        setIsSendingReset(false);
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

                <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
                    <div className="flex items-center gap-4 mb-8">
                        <img
                            src="/logo.jpeg"
                            alt="LivreCred Logo"
                            className="w-32 h-32 rounded-2xl object-cover"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-primary-foreground">Gestor Livre</h1>
                            <p className="text-primary-foreground/70">Gestão Financeira Empresarial</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <img
                            src="/logo.jpeg"
                            alt="LivreCred Logo"
                            className="w-32 h-32 rounded-xl object-cover"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Gestor Livre</h1>
                            <p className="text-xs text-muted-foreground">Sistema de Gestão personalizado da Livre Cred</p>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
                        <p className="text-muted-foreground mt-2">Entre com suas credenciais para acessar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-financial"
                                placeholder="seu@email.com"
                                tabIndex={1}
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-financial pr-11"
                                    placeholder="••••••••"
                                    tabIndex={2}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-primary hover:underline"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full h-12 text-base"
                            tabIndex={3}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Não tem uma conta?
                        {' '}
                        <a href="#" className="text-primary hover:underline">
                            Entre em contato
                        </a>
                    </p>
                </div>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Recuperar Senha</DialogTitle>
                        <DialogDescription>
                            Digite seu email para receber um link de recuperação de senha.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="input-financial pl-11"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                className="btn-secondary flex-1"
                                onClick={() => setShowForgotPassword(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSendingReset}
                                className="btn-primary flex-1"
                            >
                                {isSendingReset ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Link'
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
