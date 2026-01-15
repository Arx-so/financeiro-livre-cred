import { User } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader, EmptyState, LoadingState, SearchInput } from '@/components/shared';
import { UserForm, UserCard } from './components';
import type { useUsuariosPage } from './useUsuariosPage';

type UsuariosViewProps = ReturnType<typeof useUsuariosPage>;

export function UsuariosView(props: UsuariosViewProps) {
    const {
        // User permissions
        user,
        isAdmin,
        // Search state
        userSearchTerm,
        setUserSearchTerm,
        // Modal states
        isUserModalOpen,
        setIsUserModalOpen,
        // Form states
        userForm,
        setUserForm,
        // Data
        branches,
        users,
        usersLoading,
        // Mutations loading states
        isSavingUser,
        // Handlers
        resetUserForm,
        handleSubmitUser,
        openEditUserModal,
        toggleBranchSelection,
    } = props;

    // Redirect if not admin
    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Usuários"
                    description="Gerencie os usuários e suas permissões"
                />

                <div className="flex flex-col md:flex-row gap-4">
                    <SearchInput
                        value={userSearchTerm}
                        onChange={setUserSearchTerm}
                        placeholder="Buscar por nome, email..."
                    />
                </div>

                {usersLoading ? (
                    <LoadingState />
                ) : users.length === 0 ? (
                    <EmptyState icon={User} message="Nenhum usuário encontrado" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map((userProfile) => (
                            <UserCard
                                key={userProfile.id}
                                userProfile={userProfile}
                                currentUserId={user?.id}
                                onEdit={() => openEditUserModal(userProfile)}
                            />
                        ))}
                    </div>
                )}

                <Dialog open={isUserModalOpen} onOpenChange={(open) => { setIsUserModalOpen(open); if (!open) resetUserForm(); }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Gerenciar Usuário</DialogTitle>
                            <DialogDescription>
                                Altere a função e as filiais permitidas para este usuário.
                            </DialogDescription>
                        </DialogHeader>
                        <UserForm
                            form={userForm}
                            setForm={setUserForm}
                            branches={branches.filter((b) => b.is_active)}
                            isSaving={isSavingUser}
                            onSubmit={handleSubmitUser}
                            onCancel={() => { setIsUserModalOpen(false); resetUserForm(); }}
                            toggleBranchSelection={toggleBranchSelection}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
