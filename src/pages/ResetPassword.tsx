import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Verifica se há um hash de recuperação na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type !== 'recovery' || !accessToken) {
            setError('Link de recuperação inválido ou expirado.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error('Preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                toast.error(updateError.message || 'Erro ao atualizar senha');
                return;
            }

            setIsSuccess(true);
            toast.success('Senha atualizada com sucesso!');

            // Redireciona para login após 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch {
            toast.error('Erro ao atualizar senha. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-4">Link Inválido</h1>
                    <p className="text-muted-foreground mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-income/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-income" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-4">Senha Atualizada!</h1>
                    <p className="text-muted-foreground mb-8">
                        Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Redefinir Senha</h1>
                    <p className="text-muted-foreground mt-2">Digite sua nova senha abaixo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                            Nova Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-financial"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                            Confirmar Nova Senha
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-financial"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full h-12 text-base"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Atualizando...
                            </>
                        ) : (
                            'Atualizar Senha'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary hover:underline"
                    >
                        Voltar para Login
                    </button>
                </p>
            </div>
        </div>
    );
}
