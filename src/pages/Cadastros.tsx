import { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload,
  Camera,
  Edit,
  Trash2,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Loader2,
  Users,
  Store,
  RotateCcw,
  FileText,
  Download,
  X,
  Landmark,
  CreditCard,
  DollarSign,
  Repeat
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { 
  useFavorecidos, 
  useCreateFavorecido, 
  useUpdateFavorecido, 
  useDeleteFavorecido,
  useUploadFavorecidoPhoto,
  useFavorecidoDocuments,
  useUploadFavorecidoDocument,
  useDeleteFavorecidoDocument
} from '@/hooks/useCadastros';
import { formatFileSize, getFileIcon } from '@/services/cadastros';
import { 
  useCategoriesWithSubcategories, 
  useCreateCategory, 
  useDeleteCategory,
  useCreateSubcategories 
} from '@/hooks/useCategorias';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  useReactivateBranch
} from '@/hooks/useBranches';
import {
  useAllBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useReactivateBankAccount
} from '@/hooks/useBankAccounts';
import { formatCurrency } from '@/services/bankAccounts';
import { useAuthStore, useBranchStore } from '@/stores';
import type { FavorecidoTipo, FavorecidoInsert, BranchInsert, BankAccountInsert, RecurrenceType } from '@/types/database';

export default function Cadastros() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const isAdminOrGerente = user?.role === 'admin' || user?.role === 'gerente';
  
  // Confirmation dialog
  const { confirm, dialogProps, isOpen: confirmOpen } = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [activeTab, setActiveTab] = useState('favorecidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isFilialModalOpen, setIsFilialModalOpen] = useState(false);
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<FavorecidoTipo | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBankAccountId, setEditingBankAccountId] = useState<string | null>(null);
  const [showInactiveBranches, setShowInactiveBranches] = useState(false);
  const [showInactiveBankAccounts, setShowInactiveBankAccounts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'cliente' as FavorecidoTipo,
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    category: '',
    notes: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'receita' as 'receita' | 'despesa' | 'ambos',
    color: '#3b82f6',
    subcategories: '',
    is_recurring: false,
    default_recurrence_type: '' as RecurrenceType | '',
    default_recurrence_day: '',
  });

  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
  });

  const [bankAccountForm, setBankAccountForm] = useState({
    name: '',
    bank_name: '',
    agency: '',
    account_number: '',
    branch_id: '',
    initial_balance: '',
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Fetch data
  const { data: favorecidos, isLoading: favorecidosLoading } = useFavorecidos({
    type: filterType === 'todos' ? undefined : filterType,
    search: searchTerm || undefined,
    isActive: true,
  });

  const { data: categories, isLoading: categoriesLoading } = useCategoriesWithSubcategories();
  
  // Fetch documents for the currently editing favorecido
  const { data: favorecidoDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useFavorecidoDocuments(editingId || '');
  
  const { data: branches, isLoading: branchesLoading } = useBranches({
    isActive: showInactiveBranches ? undefined : true,
  });

  const { data: bankAccounts, isLoading: bankAccountsLoading } = useAllBankAccounts({
    isActive: showInactiveBankAccounts ? undefined : true,
  });

  // Mutations
  const createFavorecido = useCreateFavorecido();
  const updateFavorecido = useUpdateFavorecido();
  const deleteFavorecido = useDeleteFavorecido();
  const uploadPhoto = useUploadFavorecidoPhoto();
  const uploadDocument = useUploadFavorecidoDocument();
  const deleteDocument = useDeleteFavorecidoDocument();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createSubcategories = useCreateSubcategories();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const reactivateBranch = useReactivateBranch();
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();
  const reactivateBankAccount = useReactivateBankAccount();

  const filteredFavorecidos = favorecidos || [];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingId) return;

    for (const file of Array.from(files)) {
      try {
        await uploadDocument.mutateAsync({ favorecidoId: editingId, file });
        toast.success(`${file.name} enviado com sucesso!`);
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    
    // Reset the input
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = (docId: string, fileName: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteDocument.mutateAsync(docId);
        refetchDocuments();
        toast.success('Documento removido!');
      } catch (error) {
        toast.error('Erro ao remover documento');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Remover documento',
      description: `Tem certeza que deseja remover o arquivo "${fileName}"?`,
      confirmText: 'Remover',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const favorecidoData: FavorecidoInsert = {
      type: formData.type,
      name: formData.name,
      document: formData.document || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      category: formData.category || null,
      notes: formData.notes || null,
    };

    try {
      let favorecidoId = editingId;

      if (editingId) {
        await updateFavorecido.mutateAsync({ id: editingId, favorecido: favorecidoData });
      } else {
        const result = await createFavorecido.mutateAsync(favorecidoData);
        favorecidoId = result.id;
      }

      // Upload photo if selected
      if (selectedPhoto && favorecidoId) {
        await uploadPhoto.mutateAsync({ favorecidoId, file: selectedPhoto });
      }

      toast.success(editingId ? 'Cadastro atualizado!' : 'Cadastro realizado!');
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar cadastro');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newCategory = await createCategory.mutateAsync({
        name: categoryForm.name,
        type: categoryForm.type,
        color: categoryForm.color,
        is_recurring: categoryForm.is_recurring,
        default_recurrence_type: categoryForm.is_recurring && categoryForm.default_recurrence_type ? categoryForm.default_recurrence_type : null,
        default_recurrence_day: categoryForm.is_recurring && categoryForm.default_recurrence_day ? parseInt(categoryForm.default_recurrence_day) : null,
      });

      if (categoryForm.subcategories.trim()) {
        const subcategoryNames = categoryForm.subcategories.split(',').map(s => s.trim()).filter(Boolean);
        if (subcategoryNames.length > 0) {
          await createSubcategories.mutateAsync({
            categoryId: newCategory.id,
            names: subcategoryNames,
          });
        }
      }

      toast.success('Categoria criada!');
      setIsCategoriaModalOpen(false);
      setCategoryForm({ name: '', type: 'receita', color: '#3b82f6', subcategories: '', is_recurring: false, default_recurrence_type: '', default_recurrence_day: '' });
    } catch (error) {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteFavorecido.mutateAsync(id);
        toast.success('Cadastro removido!');
      } catch (error) {
        toast.error('Erro ao remover cadastro');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Excluir cadastro',
      description: `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
    });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteCategory.mutateAsync(id);
        toast.success('Categoria removida!');
      } catch (error) {
        toast.error('Erro ao remover categoria');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Excluir categoria',
      description: `Tem certeza que deseja excluir a categoria "${name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
    });
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const branchData: BranchInsert = {
      name: branchForm.name,
      code: branchForm.code,
      address: branchForm.address ? `${branchForm.address}${branchForm.city ? `, ${branchForm.city}` : ''}${branchForm.state ? ` - ${branchForm.state}` : ''}` : null,
      phone: branchForm.phone || null,
    };

    try {
      if (editingBranchId) {
        await updateBranch.mutateAsync({ id: editingBranchId, branch: branchData });
        toast.success('Filial atualizada!');
      } else {
        await createBranch.mutateAsync(branchData);
        toast.success('Filial criada!');
      }
      setIsFilialModalOpen(false);
      resetBranchForm();
    } catch (error) {
      toast.error('Erro ao salvar filial');
    }
  };

  const handleDeleteBranch = (id: string, name: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteBranch.mutateAsync(id);
        toast.success('Filial desativada!');
      } catch (error) {
        toast.error('Erro ao desativar filial');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Desativar filial',
      description: `Tem certeza que deseja desativar a filial "${name}"? Você poderá reativá-la depois.`,
      confirmText: 'Desativar',
    });
  };

  const handleReactivateBranch = async (id: string) => {
    try {
      await reactivateBranch.mutateAsync(id);
      toast.success('Filial reativada!');
    } catch (error) {
      toast.error('Erro ao reativar filial');
    }
  };

  // Bank Account handlers
  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const accountData: BankAccountInsert = {
      name: bankAccountForm.name,
      bank_name: bankAccountForm.bank_name,
      agency: bankAccountForm.agency || null,
      account_number: bankAccountForm.account_number || null,
      branch_id: bankAccountForm.branch_id,
      initial_balance: parseFloat(bankAccountForm.initial_balance) || 0,
    };

    try {
      if (editingBankAccountId) {
        await updateBankAccount.mutateAsync({ id: editingBankAccountId, account: accountData });
        toast.success('Conta bancária atualizada!');
      } else {
        await createBankAccount.mutateAsync(accountData);
        toast.success('Conta bancária criada!');
      }
      setIsBankAccountModalOpen(false);
      resetBankAccountForm();
    } catch (error) {
      toast.error('Erro ao salvar conta bancária');
    }
  };

  const handleDeleteBankAccount = (id: string, name: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteBankAccount.mutateAsync(id);
        toast.success('Conta bancária desativada!');
      } catch (error) {
        toast.error('Erro ao desativar conta bancária');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Desativar conta bancária',
      description: `Tem certeza que deseja desativar a conta "${name}"? Você poderá reativá-la depois.`,
      confirmText: 'Desativar',
    });
  };

  const handleReactivateBankAccount = async (id: string) => {
    try {
      await reactivateBankAccount.mutateAsync(id);
      toast.success('Conta bancária reativada!');
    } catch (error) {
      toast.error('Erro ao reativar conta bancária');
    }
  };

  const resetBankAccountForm = () => {
    setBankAccountForm({
      name: '',
      bank_name: '',
      agency: '',
      account_number: '',
      branch_id: '',
      initial_balance: '',
    });
    setEditingBankAccountId(null);
  };

  const openEditBankAccountModal = (account: NonNullable<typeof bankAccounts>[0]) => {
    setBankAccountForm({
      name: account.name,
      bank_name: account.bank_name,
      agency: account.agency || '',
      account_number: account.account_number || '',
      branch_id: account.branch_id,
      initial_balance: account.initial_balance.toString(),
    });
    setEditingBankAccountId(account.id);
    setIsBankAccountModalOpen(true);
  };

  const resetBranchForm = () => {
    setBranchForm({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
    });
    setEditingBranchId(null);
  };

  const openEditBranchModal = (branch: NonNullable<typeof branches>[0]) => {
    // Parse the address back to components if possible
    const addressParts = branch.address?.split(', ') || [];
    const lastPart = addressParts[addressParts.length - 1]?.split(' - ') || [];
    
    setBranchForm({
      name: branch.name,
      code: branch.code,
      address: addressParts[0] || '',
      city: addressParts.length > 1 ? (lastPart.length > 1 ? addressParts.slice(1, -1).join(', ') + ', ' + lastPart[0] : addressParts.slice(1).join(', ')) : '',
      state: lastPart.length > 1 ? lastPart[1] : '',
      zip_code: '',
      phone: branch.phone || '',
    });
    setEditingBranchId(branch.id);
    setIsFilialModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'cliente',
      name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      category: '',
      notes: '',
    });
    setEditingId(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const openEditModal = (favorecido: typeof filteredFavorecidos[0]) => {
    setFormData({
      type: favorecido.type,
      name: favorecido.name,
      document: favorecido.document || '',
      email: favorecido.email || '',
      phone: favorecido.phone || '',
      address: favorecido.address || '',
      city: favorecido.city || '',
      state: favorecido.state || '',
      zip_code: favorecido.zip_code || '',
      category: favorecido.category || '',
      notes: favorecido.notes || '',
    });
    setEditingId(favorecido.id);
    setPhotoPreview(favorecido.photo_url);
    setIsModalOpen(true);
  };

  const getTypeIcon = (type: FavorecidoTipo) => {
    switch (type) {
      case 'fornecedor':
        return <Building2 className="w-6 h-6 text-primary" />;
      case 'funcionario':
        return <Users className="w-6 h-6 text-primary" />;
      default:
        return <User className="w-6 h-6 text-primary" />;
    }
  };

  const getTypeBadge = (type: FavorecidoTipo) => {
    switch (type) {
      case 'cliente':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-income-muted text-income">Cliente</span>;
      case 'fornecedor':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-expense-muted text-expense">Fornecedor</span>;
      case 'funcionario':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Funcionário</span>;
      case 'ambos':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-pending-muted text-pending">Cliente/Fornecedor</span>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cadastros</h1>
            <p className="text-muted-foreground">Gerencie clientes, fornecedores, funcionários e categorias</p>
          </div>
        </div>

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
          </TabsList>

          <TabsContent value="favorecidos" className="space-y-6 mt-6">
            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-financial pl-11"
                />
              </div>
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
                    <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
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
                            onChange={handlePhotoSelect}
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
                              setFormData(prev => ({
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
                                disabled={uploadDocument.isPending}
                              >
                                {uploadDocument.isPending ? (
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
                                onChange={handleDocumentUpload}
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
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (favorecidoDocuments || []).length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {favorecidoDocuments?.map((doc) => (
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
                                    onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
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

                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="btn-primary"
                          disabled={createFavorecido.isPending || updateFavorecido.isPending || uploadPhoto.isPending}
                        >
                          {(createFavorecido.isPending || updateFavorecido.isPending || uploadPhoto.isPending) && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {editingId ? 'Atualizar' : 'Salvar'} Cadastro
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Favorecidos Grid */}
            {favorecidosLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFavorecidos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cadastro encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFavorecidos.map((favorecido) => (
                  <div key={favorecido.id} className="card-financial p-5 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {favorecido.photo_url ? (
                          <img 
                            src={favorecido.photo_url} 
                            alt={favorecido.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            {getTypeIcon(favorecido.type)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{favorecido.name}</h3>
                          {getTypeBadge(favorecido.type)}
                        </div>
                      </div>
                      <button className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      {favorecido.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{favorecido.email}</span>
                        </div>
                      )}
                      {favorecido.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{favorecido.phone}</span>
                        </div>
                      )}
                      {favorecido.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{favorecido.city}{favorecido.state ? ` - ${favorecido.state}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <button 
                        className="btn-secondary flex-1 py-2"
                        onClick={() => openEditModal(favorecido)}
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button 
                        className="btn-secondary py-2 px-3 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(favorecido.id, favorecido.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-6 mt-6">
            {/* Actions */}
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
                  <form className="space-y-4 mt-4" onSubmit={handleCategorySubmit}>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                      <input 
                        type="text" 
                        className="input-financial" 
                        placeholder="Nome da categoria"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                        <select 
                          className="input-financial"
                          value={categoryForm.type}
                          onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'receita' | 'despesa' | 'ambos' })}
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
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Subcategorias</label>
                      <textarea 
                        className="input-financial min-h-[80px]" 
                        placeholder="Digite as subcategorias separadas por vírgula"
                        value={categoryForm.subcategories}
                        onChange={(e) => setCategoryForm({ ...categoryForm, subcategories: e.target.value })}
                      />
                    </div>

                    {/* Recurrence Settings */}
                    <div className="border-t border-border pt-4 mt-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={categoryForm.is_recurring}
                          onChange={(e) => setCategoryForm({ ...categoryForm, is_recurring: e.target.checked })}
                          className="w-4 h-4 rounded border-input"
                        />
                        <span className="text-sm font-medium text-foreground">Categoria recorrente</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        Lançamentos desta categoria terão recorrência por padrão
                      </p>

                      {categoryForm.is_recurring && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Tipo de Recorrência</label>
                            <select 
                              className="input-financial"
                              value={categoryForm.default_recurrence_type}
                              onChange={(e) => setCategoryForm({ ...categoryForm, default_recurrence_type: e.target.value as RecurrenceType | '' })}
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
                              {categoryForm.default_recurrence_type === 'semanal' ? 'Dia da Semana' : 'Dia do Mês'}
                            </label>
                            {categoryForm.default_recurrence_type === 'semanal' ? (
                              <select 
                                className="input-financial"
                                value={categoryForm.default_recurrence_day}
                                onChange={(e) => setCategoryForm({ ...categoryForm, default_recurrence_day: e.target.value })}
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
                                value={categoryForm.default_recurrence_day}
                                onChange={(e) => setCategoryForm({ ...categoryForm, default_recurrence_day: e.target.value })}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" className="btn-secondary" onClick={() => setIsCategoriaModalOpen(false)}>
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={createCategory.isPending}
                      >
                        {createCategory.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar Categoria
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Categories List */}
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4">
                {(categories || []).map((categoria) => (
                  <div key={categoria.id} className="card-financial p-5 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: categoria.color }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{categoria.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              categoria.type === 'receita' ? 'bg-income-muted text-income' :
                              categoria.type === 'despesa' ? 'bg-expense-muted text-expense' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {categoria.type === 'ambos' ? 'Receita/Despesa' : 
                               categoria.type.charAt(0).toUpperCase() + categoria.type.slice(1)}
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

          {/* Contas Bancárias Tab - Admin and Gerente */}
          {isAdminOrGerente && (
            <TabsContent value="contas-bancarias" className="space-y-6 mt-6">
              {/* Actions */}
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
                    <form className="space-y-4 mt-4" onSubmit={handleBankAccountSubmit}>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nome da Conta *</label>
                        <input 
                          type="text" 
                          className="input-financial" 
                          placeholder="Ex: Conta Principal, Caixa Empresa"
                          value={bankAccountForm.name}
                          onChange={(e) => setBankAccountForm({ ...bankAccountForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Banco *</label>
                        <input 
                          type="text" 
                          className="input-financial" 
                          placeholder="Ex: Banco do Brasil, Itaú, Bradesco"
                          value={bankAccountForm.bank_name}
                          onChange={(e) => setBankAccountForm({ ...bankAccountForm, bank_name: e.target.value })}
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
                            value={bankAccountForm.agency}
                            onChange={(e) => setBankAccountForm({ ...bankAccountForm, agency: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Número da Conta</label>
                          <input 
                            type="text" 
                            className="input-financial" 
                            placeholder="00000-0"
                            value={bankAccountForm.account_number}
                            onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_number: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Filial *</label>
                        <select 
                          className="input-financial"
                          value={bankAccountForm.branch_id}
                          onChange={(e) => setBankAccountForm({ ...bankAccountForm, branch_id: e.target.value })}
                          required
                        >
                          <option value="">Selecione uma filial</option>
                          {(branches || []).filter(b => b.is_active).map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name} ({branch.code})
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
                          value={bankAccountForm.initial_balance}
                          onChange={(e) => setBankAccountForm({ ...bankAccountForm, initial_balance: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" className="btn-secondary" onClick={() => { setIsBankAccountModalOpen(false); resetBankAccountForm(); }}>
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="btn-primary"
                          disabled={createBankAccount.isPending || updateBankAccount.isPending}
                        >
                          {(createBankAccount.isPending || updateBankAccount.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                          {editingBankAccountId ? 'Atualizar' : 'Salvar'} Conta
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Bank Accounts List */}
              {bankAccountsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (bankAccounts || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conta bancária encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(bankAccounts || []).map((account) => (
                    <div key={account.id} className={`card-financial p-5 group ${!account.is_active ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Landmark className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{account.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {account.bank_name}
                              </span>
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
                            <span>Ag: {account.agency} | Cc: {account.account_number || '-'}</span>
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
                        <button 
                          className="btn-secondary flex-1 py-2"
                          onClick={() => openEditBankAccountModal(account)}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        {account.is_active ? (
                          <button 
                            className="btn-secondary py-2 px-3 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteBankAccount(account.id, account.name)}
                            disabled={deleteBankAccount.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            className="btn-secondary py-2 px-3 text-income hover:bg-income/10"
                            onClick={() => handleReactivateBankAccount(account.id)}
                            disabled={reactivateBankAccount.isPending}
                            title="Reativar conta"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Filiais Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="filiais" className="space-y-6 mt-6">
              {/* Actions */}
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
                    <form className="space-y-4 mt-4" onSubmit={handleBranchSubmit}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Nome da Filial *</label>
                          <input 
                            type="text" 
                            className="input-financial" 
                            placeholder="Ex: Matriz, Filial Centro"
                            value={branchForm.name}
                            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Código *</label>
                          <input 
                            type="text" 
                            className="input-financial" 
                            placeholder="Ex: MTZ, FLC01"
                            value={branchForm.code}
                            onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                        <PhoneInput
                          value={branchForm.phone}
                          onChange={(value) => setBranchForm({ ...branchForm, phone: value })}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                          <CepInput
                            value={branchForm.zip_code}
                            onChange={(value) => setBranchForm({ ...branchForm, zip_code: value })}
                            onAddressFound={(address) => {
                              setBranchForm(prev => ({
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
                            value={branchForm.city}
                            onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                          <input 
                            type="text" 
                            className="input-financial" 
                            placeholder="UF"
                            value={branchForm.state}
                            onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                        <input 
                          type="text" 
                          className="input-financial" 
                          placeholder="Rua, número, bairro"
                          value={branchForm.address}
                          onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" className="btn-secondary" onClick={() => { setIsFilialModalOpen(false); resetBranchForm(); }}>
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="btn-primary"
                          disabled={createBranch.isPending || updateBranch.isPending}
                        >
                          {(createBranch.isPending || updateBranch.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                          {editingBranchId ? 'Atualizar' : 'Salvar'} Filial
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Branches List */}
              {branchesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (branches || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma filial encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(branches || []).map((branch) => (
                    <div key={branch.id} className={`card-financial p-5 group ${!branch.is_active ? 'opacity-60' : ''}`}>
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
                        <button 
                          className="btn-secondary flex-1 py-2"
                          onClick={() => openEditBranchModal(branch)}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        {branch.is_active ? (
                          <button 
                            className="btn-secondary py-2 px-3 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteBranch(branch.id, branch.name)}
                            disabled={deleteBranch.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            className="btn-secondary py-2 px-3 text-income hover:bg-income/10"
                            onClick={() => handleReactivateBranch(branch.id)}
                            disabled={reactivateBranch.isPending}
                            title="Reativar filial"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
    </AppLayout>
  );
}
