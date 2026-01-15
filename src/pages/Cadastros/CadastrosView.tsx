import {
    Plus,
    Upload,
    Camera,
    Edit,
    Trash2,
    Loader2,
    Store,
    RotateCcw,
    FileText,
    Download,
    Landmark,
    CreditCard,
    DollarSign,
    Repeat,
    History,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DocumentInput } from '@/components/ui/document-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { CepInput } from '@/components/ui/cep-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    PageHeader, EmptyState, LoadingState, SearchInput
} from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import { getActionText, formatLogDetails } from '@/services/activityLogs';
import { formatFileSize, getFileIcon } from '@/services/cadastros';
import { getRoleText, getRoleBadgeClass } from '@/services/users';
import { FavorecidoCard } from './components';
import type { useCadastrosPage } from './useCadastrosPage';
import type {
    FavorecidoTipo, BankAccountType, PixKeyType, PaymentType, RecurrenceType, UserRole
} from '@/types/database';

type CadastrosViewProps = ReturnType<typeof useCadastrosPage>;

export function CadastrosView(props: CadastrosViewProps) {
    const {
        // User permissions
        user,
        isAdmin,
        isAdminOrGerente,
        // Dialog
        dialogProps,
        isDeleting,
        // Tab state
        activeTab,
        setActiveTab,
        // Search and filters
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        showInactiveBranches,
        setShowInactiveBranches,
        showInactiveBankAccounts,
        setShowInactiveBankAccounts,
        userSearchTerm,
        setUserSearchTerm,
        // Modal states
        isModalOpen,
        setIsModalOpen,
        isCategoriaModalOpen,
        setIsCategoriaModalOpen,
        isFilialModalOpen,
        setIsFilialModalOpen,
        isBankAccountModalOpen,
        setIsBankAccountModalOpen,
        isUserModalOpen,
        setIsUserModalOpen,
        // Editing states
        editingId,
        editingBranchId,
        editingBankAccountId,
        // Refs
        fileInputRef,
        documentInputRef,
        // Form states
        formData,
        setFormData,
        categoryForm,
        setCategoryForm,
        branchForm,
        setBranchForm,
        bankAccountForm,
        setBankAccountForm,
        userForm,
        setUserForm,
        // Photo state
        photoPreview,
        // Data
        favorecidos,
        favorecidosLoading,
        categories,
        categoriesLoading,
        favorecidoDocuments,
        documentsLoading,
        favorecidoLogs,
        logsLoading,
        branches,
        branchesLoading,
        bankAccounts,
        bankAccountsLoading,
        users,
        usersLoading,
        // Mutations loading states
        isSavingFavorecido,
        isSavingCategory,
        isSavingBranch,
        isSavingBankAccount,
        isSavingUser,
        isUploadingDocument,
        // Handlers
        handlePhotoSelect,
        handleDocumentUpload,
        handleDeleteDocument,
        resetForm,
        handleSubmitFavorecido,
        handleDeleteFavorecido,
        openEditFavorecidoModal,
        handleSubmitCategory,
        handleDeleteCategory,
        resetBranchForm,
        handleSubmitBranch,
        handleDeleteBranch,
        handleReactivateBranch,
        openEditBranchModal,
        resetBankAccountForm,
        handleSubmitBankAccount,
        handleDeleteBankAccount,
        handleReactivateBankAccount,
        openEditBankAccountModal,
        resetUserForm,
        handleSubmitUser,
        openEditUserModal,
        toggleBranchSelection,
    } = props;

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Cadastros"
                    description="Gerencie clientes, fornecedores, funcionários e categorias"
                />

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="favorecidos" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Favorecidos
                        </TabsTrigger>
                        <TabsTrigger value="categorias" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Categorias
                        </TabsTrigger>
                        {isAdminOrGerente && (
                            <TabsTrigger value="contas-bancarias" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                                Contas Bancárias
                            </TabsTrigger>
                        )}
                        {isAdmin && (
                            <TabsTrigger value="filiais" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                                Filiais
                            </TabsTrigger>
                        )}
                        {isAdmin && (
                            <TabsTrigger value="usuarios" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                                Usuários
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Favorecidos Tab */}
                    <TabsContent value="favorecidos" className="space-y-6 mt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <SearchInput
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Buscar por nome, email, telefone..."
                            />
                            <div className="flex gap-2">
                                <select
                                    className="input-financial"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as FavorecidoTipo | 'todos')}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="cliente">Clientes</option>
                                    <option value="fornecedor">Fornecedores</option>
                                    <option value="funcionario">Funcionários</option>
                                </select>
                                <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
                                    <DialogTrigger asChild>
                                        <button className="btn-primary">
                                            <Plus className="w-4 h-4" />
                                            Novo Cadastro
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>{editingId ? 'Editar Favorecido' : 'Novo Favorecido'}</DialogTitle>
                                            <DialogDescription>
                                                Cadastre um novo cliente, fornecedor ou funcionário.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <FavorecidoForm
                                            formData={formData}
                                            setFormData={setFormData}
                                            editingId={editingId}
                                            photoPreview={photoPreview}
                                            fileInputRef={fileInputRef}
                                            documentInputRef={documentInputRef}
                                            favorecidoDocuments={favorecidoDocuments}
                                            documentsLoading={documentsLoading}
                                            favorecidoLogs={favorecidoLogs}
                                            logsLoading={logsLoading}
                                            isUploadingDocument={isUploadingDocument}
                                            isSaving={isSavingFavorecido}
                                            onPhotoSelect={handlePhotoSelect}
                                            onDocumentUpload={handleDocumentUpload}
                                            onDeleteDocument={handleDeleteDocument}
                                            onSubmit={handleSubmitFavorecido}
                                            onCancel={() => { setIsModalOpen(false); resetForm(); }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {favorecidosLoading ? (
                            <LoadingState />
                        ) : favorecidos.length === 0 ? (
                            <EmptyState icon={User} message="Nenhum cadastro encontrado" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {favorecidos.map((favorecido) => (
                                    <FavorecidoCard
                                        key={favorecido.id}
                                        favorecido={favorecido}
                                        onEdit={() => openEditFavorecidoModal(favorecido)}
                                        onDelete={() => handleDeleteFavorecido(favorecido.id, favorecido.name)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Categorias Tab */}
                    <TabsContent value="categorias" className="space-y-6 mt-6">
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground">Gerencie categorias e subcategorias para organizar seus lançamentos</p>
                            <Dialog open={isCategoriaModalOpen} onOpenChange={setIsCategoriaModalOpen}>
                                <DialogTrigger asChild>
                                    <button className="btn-primary">
                                        <Plus className="w-4 h-4" />
                                        Nova Categoria
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nova Categoria</DialogTitle>
                                        <DialogDescription>
                                            Crie uma nova categoria para organizar seus lançamentos.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <CategoryForm
                                        form={categoryForm}
                                        setForm={setCategoryForm}
                                        isSaving={isSavingCategory}
                                        onSubmit={handleSubmitCategory}
                                        onCancel={() => setIsCategoriaModalOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>

                        {categoriesLoading ? (
                            <LoadingState />
                        ) : (
                            <div className="grid gap-4">
                                {categories.map((categoria) => (
                                    <div key={categoria.id} className="card-financial p-5 group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-12 rounded-full" style={{ backgroundColor: categoria.color }} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-foreground">{categoria.name}</h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            categoria.type === 'receita' ? 'bg-income-muted text-income'
                                                                : categoria.type === 'despesa' ? 'bg-expense-muted text-expense'
                                                                    : 'bg-primary/10 text-primary'
                                                        }`}
                                                        >
                                                            {categoria.type === 'ambos' ? 'Receita/Despesa'
                                                                : categoria.type.charAt(0).toUpperCase() + categoria.type.slice(1)}
                                                        </span>
                                                        {categoria.is_recurring && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-pending-muted text-pending flex items-center gap-1">
                                                                <Repeat className="w-3 h-3" />
                                                                Recorrente
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {categoria.subcategories.map((sub) => (
                                                            <span key={sub.id} className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                                                                {sub.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="btn-secondary p-2">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="btn-secondary p-2 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteCategory(categoria.id, categoria.name)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Contas Bancárias Tab */}
                    {isAdminOrGerente && (
                        <TabsContent value="contas-bancarias" className="space-y-6 mt-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <p className="text-muted-foreground">Gerencie as contas bancárias da empresa</p>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showInactiveBankAccounts}
                                            onChange={(e) => setShowInactiveBankAccounts(e.target.checked)}
                                            className="w-4 h-4 rounded border-input"
                                        />
                                        <span className="text-muted-foreground">Mostrar inativas</span>
                                    </label>
                                </div>
                                <Dialog open={isBankAccountModalOpen} onOpenChange={(open) => { setIsBankAccountModalOpen(open); if (!open) resetBankAccountForm(); }}>
                                    <DialogTrigger asChild>
                                        <button className="btn-primary">
                                            <Plus className="w-4 h-4" />
                                            Nova Conta
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>{editingBankAccountId ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
                                            <DialogDescription>
                                                {editingBankAccountId ? 'Atualize os dados da conta bancária.' : 'Cadastre uma nova conta bancária.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <BankAccountForm
                                            form={bankAccountForm}
                                            setForm={setBankAccountForm}
                                            branches={branches.filter((b) => b.is_active)}
                                            isEditing={!!editingBankAccountId}
                                            isSaving={isSavingBankAccount}
                                            onSubmit={handleSubmitBankAccount}
                                            onCancel={() => { setIsBankAccountModalOpen(false); resetBankAccountForm(); }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {bankAccountsLoading ? (
                                <LoadingState />
                            ) : bankAccounts.length === 0 ? (
                                <EmptyState icon={Landmark} message="Nenhuma conta bancária encontrada" />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bankAccounts.map((account) => (
                                        <BankAccountCard
                                            key={account.id}
                                            account={account}
                                            onEdit={() => openEditBankAccountModal(account)}
                                            onDelete={() => handleDeleteBankAccount(account.id, account.name)}
                                            onReactivate={() => handleReactivateBankAccount(account.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* Filiais Tab */}
                    {isAdmin && (
                        <TabsContent value="filiais" className="space-y-6 mt-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <p className="text-muted-foreground">Gerencie as filiais da empresa</p>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showInactiveBranches}
                                            onChange={(e) => setShowInactiveBranches(e.target.checked)}
                                            className="w-4 h-4 rounded border-input"
                                        />
                                        <span className="text-muted-foreground">Mostrar inativas</span>
                                    </label>
                                </div>
                                <Dialog open={isFilialModalOpen} onOpenChange={(open) => { setIsFilialModalOpen(open); if (!open) resetBranchForm(); }}>
                                    <DialogTrigger asChild>
                                        <button className="btn-primary">
                                            <Plus className="w-4 h-4" />
                                            Nova Filial
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>{editingBranchId ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
                                            <DialogDescription>
                                                {editingBranchId ? 'Atualize os dados da filial.' : 'Cadastre uma nova filial para sua empresa.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <BranchForm
                                            form={branchForm}
                                            setForm={setBranchForm}
                                            isEditing={!!editingBranchId}
                                            isSaving={isSavingBranch}
                                            onSubmit={handleSubmitBranch}
                                            onCancel={() => { setIsFilialModalOpen(false); resetBranchForm(); }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {branchesLoading ? (
                                <LoadingState />
                            ) : branches.length === 0 ? (
                                <EmptyState icon={Store} message="Nenhuma filial encontrada" />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {branches.map((branch) => (
                                        <BranchCard
                                            key={branch.id}
                                            branch={branch}
                                            onEdit={() => openEditBranchModal(branch)}
                                            onDelete={() => handleDeleteBranch(branch.id, branch.name)}
                                            onReactivate={() => handleReactivateBranch(branch.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* Usuários Tab */}
                    {isAdmin && (
                        <TabsContent value="usuarios" className="space-y-6 mt-6">
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
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}

// Sub-components for forms
interface FavorecidoFormProps {
    formData: any;
    setFormData: (data: any) => void;
    editingId: string | null;
    photoPreview: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    documentInputRef: React.RefObject<HTMLInputElement>;
    favorecidoDocuments: any[];
    documentsLoading: boolean;
    favorecidoLogs: any[];
    logsLoading: boolean;
    isUploadingDocument: boolean;
    isSaving: boolean;
    onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteDocument: (docId: string, fileName: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

function FavorecidoForm(props: FavorecidoFormProps) {
    const {
        formData, setFormData, editingId, photoPreview, fileInputRef, documentInputRef,
        favorecidoDocuments, documentsLoading, favorecidoLogs, logsLoading,
        isUploadingDocument, isSaving, onPhotoSelect, onDocumentUpload, onDeleteDocument,
        onSubmit, onCancel,
    } = props;

    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
                <div
                    className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                </div>
                <div>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-4 h-4" />
                        Upload Foto
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF até 5MB</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPhotoSelect}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                    <select
                        className="input-financial"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as FavorecidoTipo })}
                    >
                        <option value="cliente">Cliente</option>
                        <option value="fornecedor">Fornecedor</option>
                        <option value="funcionario">Funcionário</option>
                        <option value="ambos">Cliente e Fornecedor</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: Premium, VIP, Vendedor"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome / Razão Social *</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Nome completo ou razão social"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CPF/CNPJ</label>
                    <DocumentInput
                        value={formData.document}
                        onChange={(value) => setFormData({ ...formData, document: value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                    <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                    type="email"
                    className="input-financial"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Rua, número, bairro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                    <CepInput
                        value={formData.zip_code}
                        onChange={(value) => setFormData({ ...formData, zip_code: value })}
                        onAddressFound={(address) => {
                            setFormData((prev: any) => ({
                                ...prev,
                                address: address.logradouro ? `${address.logradouro}${address.bairro ? `, ${address.bairro}` : ''}` : prev.address,
                                city: address.localidade || prev.city,
                                state: address.uf || prev.state,
                            }));
                            toast.success('Endereço encontrado!');
                        }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cidade</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Cidade"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="UF"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                <textarea
                    className="input-financial min-h-[80px]"
                    placeholder="Observações adicionais"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>

            {/* Banking Section */}
            <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                    <Landmark className="w-4 h-4 text-primary" />
                    <label className="block text-sm font-medium text-foreground">Dados Bancários</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Data de Nascimento</label>
                        <input
                            type="date"
                            className="input-financial"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Forma de Pagamento Preferida</label>
                        <select
                            className="input-financial"
                            value={formData.preferred_payment_type}
                            onChange={(e) => setFormData({ ...formData, preferred_payment_type: e.target.value as PaymentType | '' })}
                        >
                            <option value="">Selecione</option>
                            <option value="pix">PIX</option>
                            <option value="ted">TED</option>
                            <option value="boleto">Boleto</option>
                            <option value="cartao">Cartão</option>
                            <option value="dinheiro">Dinheiro</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo Chave PIX</label>
                        <select
                            className="input-financial"
                            value={formData.pix_key_type}
                            onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value as PixKeyType | '' })}
                        >
                            <option value="">Selecione</option>
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                            <option value="email">E-mail</option>
                            <option value="telefone">Telefone</option>
                            <option value="aleatoria">Chave Aleatória</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Chave PIX</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="Chave PIX"
                            value={formData.pix_key}
                            onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Banco</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="Nome do banco"
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Agência</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="0000"
                            value={formData.bank_agency}
                            onChange={(e) => setFormData({ ...formData, bank_agency: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Conta</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="00000-0"
                            value={formData.bank_account}
                            onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                        <select
                            className="input-financial"
                            value={formData.bank_account_type}
                            onChange={(e) => setFormData({ ...formData, bank_account_type: e.target.value as BankAccountType | '' })}
                        >
                            <option value="">Selecione</option>
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Documents Section */}
            <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Documentos
                    </label>
                    {editingId && (
                        <>
                            <button
                                type="button"
                                className="btn-secondary text-sm py-1"
                                onClick={() => documentInputRef.current?.click()}
                                disabled={isUploadingDocument}
                            >
                                {isUploadingDocument ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                Anexar
                            </button>
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
                                className="hidden"
                                multiple
                                onChange={onDocumentUpload}
                            />
                        </>
                    )}
                </div>

                {!editingId ? (
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Salve o cadastro primeiro para adicionar documentos
                        </p>
                    </div>
                ) : documentsLoading ? (
                    <LoadingState size="sm" />
                ) : favorecidoDocuments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {favorecidoDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg flex-shrink-0">{getFileIcon(doc.file_type)}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate" title={doc.file_name}>
                                            {doc.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(doc.file_size)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4 text-muted-foreground" />
                                    </a>
                                    <button
                                        type="button"
                                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                        onClick={() => onDeleteDocument(doc.id, doc.file_name)}
                                        title="Remover"
                                    >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum documento anexado
                    </p>
                )}
            </div>

            {/* Activity Log Section */}
            {editingId && (
                <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-primary" />
                        <label className="block text-sm font-medium text-foreground">Histórico de Atividades</label>
                    </div>

                    {logsLoading ? (
                        <LoadingState size="sm" />
                    ) : favorecidoLogs.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {favorecidoLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg"
                                >
                                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-foreground">
                                                {getActionText(log.action)}
                                            </p>
                                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        {log.user_name && (
                                            <p className="text-xs text-muted-foreground">
                                                por
                                                {' '}
                                                {log.user_name}
                                            </p>
                                        )}
                                        {log.details && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatLogDetails(log.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum histórico registrado
                        </p>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? 'Atualizar' : 'Salvar'}
                    {' '}
                    Cadastro
                </button>
            </div>
        </form>
    );
}

// Category Form
interface CategoryFormProps {
    form: any;
    setForm: (form: any) => void;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

function CategoryForm({
    form, setForm, isSaving, onSubmit, onCancel
}: CategoryFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Nome da categoria"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                    <select
                        className="input-financial"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                        <option value="ambos">Ambos</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
                    <input
                        type="color"
                        className="input-financial h-10"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subcategorias</label>
                <textarea
                    className="input-financial min-h-[80px]"
                    placeholder="Digite as subcategorias separadas por vírgula"
                    value={form.subcategories}
                    onChange={(e) => setForm({ ...form, subcategories: e.target.value })}
                />
            </div>

            <div className="border-t border-border pt-4 mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_recurring}
                        onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                        className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm font-medium text-foreground">Categoria recorrente</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                    Lançamentos desta categoria terão recorrência por padrão
                </p>

                {form.is_recurring && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Tipo de Recorrência</label>
                            <select
                                className="input-financial"
                                value={form.default_recurrence_type}
                                onChange={(e) => setForm({ ...form, default_recurrence_type: e.target.value as RecurrenceType | '' })}
                            >
                                <option value="">Selecione...</option>
                                <option value="diario">Diário</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensal">Mensal</option>
                                <option value="anual">Anual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                {form.default_recurrence_type === 'semanal' ? 'Dia da Semana' : 'Dia do Mês'}
                            </label>
                            {form.default_recurrence_type === 'semanal' ? (
                                <select
                                    className="input-financial"
                                    value={form.default_recurrence_day}
                                    onChange={(e) => setForm({ ...form, default_recurrence_day: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="0">Domingo</option>
                                    <option value="1">Segunda-feira</option>
                                    <option value="2">Terça-feira</option>
                                    <option value="3">Quarta-feira</option>
                                    <option value="4">Quinta-feira</option>
                                    <option value="5">Sexta-feira</option>
                                    <option value="6">Sábado</option>
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="input-financial"
                                    placeholder="1-31"
                                    value={form.default_recurrence_day}
                                    onChange={(e) => setForm({ ...form, default_recurrence_day: e.target.value })}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Categoria
                </button>
            </div>
        </form>
    );
}

// Branch Form and Card
interface BranchFormProps {
    form: any;
    setForm: (form: any) => void;
    isEditing: boolean;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

function BranchForm({
    form, setForm, isEditing, isSaving, onSubmit, onCancel
}: BranchFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nome da Filial *</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: Matriz, Filial Centro"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Código *</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: MTZ, FLC01"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                <PhoneInput
                    value={form.phone}
                    onChange={(value) => setForm({ ...form, phone: value })}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                    <CepInput
                        value={form.zip_code}
                        onChange={(value) => setForm({ ...form, zip_code: value })}
                        onAddressFound={(address) => {
                            setForm((prev: any) => ({
                                ...prev,
                                address: address.logradouro ? `${address.logradouro}${address.bairro ? `, ${address.bairro}` : ''}` : prev.address,
                                city: address.localidade || prev.city,
                                state: address.uf || prev.state,
                            }));
                            toast.success('Endereço encontrado!');
                        }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cidade</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Cidade"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="UF"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Rua, número, bairro"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Atualizar' : 'Salvar'}
                    {' '}
                    Filial
                </button>
            </div>
        </form>
    );
}

function BranchCard({
    branch, onEdit, onDelete, onReactivate
}: { branch: any; onEdit: () => void; onDelete: () => void; onReactivate: () => void }) {
    return (
        <div className={`card-financial p-5 group ${!branch.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{branch.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                                {branch.code}
                            </span>
                            {branch.is_active ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-income-muted text-income">Ativa</span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-expense-muted text-expense">Inativa</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                {branch.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{branch.phone}</span>
                    </div>
                )}
                {branch.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{branch.address}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button className="btn-secondary flex-1 py-2" onClick={onEdit}>
                    <Edit className="w-4 h-4" />
                    Editar
                </button>
                {branch.is_active ? (
                    <button
                        className="btn-secondary py-2 px-3 text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        className="btn-secondary py-2 px-3 text-income hover:bg-income/10"
                        onClick={onReactivate}
                        title="Reativar filial"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Bank Account Form and Card
interface BankAccountFormProps {
    form: any;
    setForm: (form: any) => void;
    branches: any[];
    isEditing: boolean;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

function BankAccountForm({
    form, setForm, branches, isEditing, isSaving, onSubmit, onCancel
}: BankAccountFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome da Conta *</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Ex: Conta Principal, Caixa Empresa"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Banco *</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Ex: Banco do Brasil, Itaú, Bradesco"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Agência</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="0000"
                        value={form.agency}
                        onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Número da Conta</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="00000-0"
                        value={form.account_number}
                        onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Filial *</label>
                <select
                    className="input-financial"
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    required
                >
                    <option value="">Selecione uma filial</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                            {' '}
                            (
                            {branch.code}
                            )
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Saldo Inicial</label>
                <input
                    type="number"
                    step="0.01"
                    className="input-financial"
                    placeholder="0,00"
                    value={form.initial_balance}
                    onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Atualizar' : 'Salvar'}
                    {' '}
                    Conta
                </button>
            </div>
        </form>
    );
}

function BankAccountCard({
    account, onEdit, onDelete, onReactivate
}: { account: any; onEdit: () => void; onDelete: () => void; onReactivate: () => void }) {
    return (
        <div className={`card-financial p-5 group ${!account.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{account.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{account.bank_name}</span>
                            {account.is_active ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-income-muted text-income">Ativa</span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-expense-muted text-expense">Inativa</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                {account.agency && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        <span>
                            Ag:
                            {account.agency}
                            {' '}
                            | Cc:
                            {account.account_number || '-'}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Store className="w-4 h-4" />
                    <span>{account.branch?.name || 'Sem filial'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className={`font-semibold ${account.current_balance >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatCurrency(account.current_balance)}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button className="btn-secondary flex-1 py-2" onClick={onEdit}>
                    <Edit className="w-4 h-4" />
                    Editar
                </button>
                {account.is_active ? (
                    <button
                        className="btn-secondary py-2 px-3 text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        className="btn-secondary py-2 px-3 text-income hover:bg-income/10"
                        onClick={onReactivate}
                        title="Reativar conta"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// User Form and Card
interface UserFormProps {
    form: any;
    setForm: (form: any) => void;
    branches: any[];
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    toggleBranchSelection: (branchId: string) => void;
}

function UserForm({
    form, setForm, branches, isSaving, onSubmit, onCancel, toggleBranchSelection
}: UserFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Função</label>
                <select
                    className="input-financial"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                    <option value="usuario">Usuário</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                    {form.role === 'admin' && 'Administradores têm acesso total ao sistema.'}
                    {form.role === 'gerente' && 'Gerentes podem gerenciar lançamentos e cadastros nas filiais permitidas.'}
                    {form.role === 'usuario' && 'Usuários podem visualizar e criar lançamentos nas filiais permitidas.'}
                </p>
            </div>

            {form.role !== 'admin' && (
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Filiais Permitidas</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                        {branches.map((branch) => (
                            <label
                                key={branch.id}
                                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.selectedBranches.includes(branch.id)}
                                    onChange={() => toggleBranchSelection(branch.id)}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{branch.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        (
                                        {branch.code}
                                        )
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Selecione as filiais que este usuário pode acessar.
                    </p>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                </button>
            </div>
        </form>
    );
}

function UserCard({ userProfile, currentUserId, onEdit }: { userProfile: any; currentUserId?: string; onEdit: () => void }) {
    return (
        <div className="card-financial p-5 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {userProfile.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt={userProfile.name}
                            className="w-12 h-12 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-foreground">{userProfile.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeClass(userProfile.role)}`}>
                            {getRoleText(userProfile.role)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                        Cadastrado em
                        {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button
                    className="btn-secondary flex-1 py-2"
                    onClick={onEdit}
                    disabled={userProfile.id === currentUserId}
                >
                    <Edit className="w-4 h-4" />
                    {userProfile.id === currentUserId ? 'Você' : 'Gerenciar'}
                </button>
            </div>
        </div>
    );
}
