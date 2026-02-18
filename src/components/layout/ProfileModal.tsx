import { useState } from 'react';
import {
    Loader2, Eye, EyeOff, KeyRound, User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores';
import { updateUser, getRoleText, getRoleBadgeClass } from '@/services/users';
import { supabase } from '@/lib/supabase';

interface ProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
    const user = useAuthStore((state) => state.user);
    const refreshUser = useAuthStore((state) => state.refreshUser);

    const [name, setName] = useState(user?.name ?? '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const getInitials = (fullName: string) => fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleSaveProfile = async () => {
        if (!user) return;
        if (!name.trim()) {
            toast.error('O nome não pode estar vazio.');
            return;
        }

        setIsSavingProfile(true);
        try {
            await updateUser(user.id, { name: name.trim() });
            await refreshUser();
            toast.success('Perfil atualizado com sucesso.');
        } catch {
            toast.error('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Preencha a nova senha e a confirmação.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('A nova senha e a confirmação não coincidem.');
            return;
        }

        setIsSavingPassword(true);
        try {
            // Re-authenticate with current password before changing
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email ?? '',
                password: currentPassword,
            });

            if (signInError) {
                toast.error('Senha atual incorreta.');
                setIsSavingPassword(false);
                return;
            }

            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                toast.error('Erro ao alterar senha. Tente novamente.');
            } else {
                toast.success('Senha alterada com sucesso.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch {
            toast.error('Erro ao alterar senha. Tente novamente.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            // Reset password fields on close
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Reset name to current user name
            setName(user?.name ?? '');
        }
        onOpenChange(value);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Meu Perfil</DialogTitle>
                    <DialogDescription>
                        Gerencie suas informações pessoais e segurança da conta.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-2">
                    {/* Avatar + role */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-lg font-semibold">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-base">{user.name}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                            <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                                {getRoleText(user.role)}
                            </span>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Profile info section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="size-4" />
                            Informações Pessoais
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" htmlFor="profile-name">
                                Nome
                            </label>
                            <input
                                id="profile-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-financial"
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" htmlFor="profile-email">
                                Email
                            </label>
                            <input
                                id="profile-email"
                                type="email"
                                value={user.email}
                                readOnly
                                className="input-financial bg-muted text-muted-foreground cursor-not-allowed"
                            />
                            <span className="text-xs text-muted-foreground">
                                O email não pode ser alterado por aqui.
                            </span>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile || name.trim() === user.name}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isSavingProfile && <Loader2 className="size-4 animate-spin" />}
                                Salvar Nome
                            </button>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Password section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <KeyRound className="size-4" />
                            Alterar Senha
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" htmlFor="current-password">
                                Senha atual
                            </label>
                            <div className="relative">
                                <input
                                    id="current-password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="input-financial pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" htmlFor="new-password">
                                Nova senha
                            </label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-financial pr-10"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" htmlFor="confirm-password">
                                Confirmar nova senha
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-financial pr-10"
                                    placeholder="Repita a nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleChangePassword}
                                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isSavingPassword && <Loader2 className="size-4 animate-spin" />}
                                Alterar Senha
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
