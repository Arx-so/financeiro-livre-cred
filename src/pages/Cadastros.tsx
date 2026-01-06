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
  Users
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
import { toast } from 'sonner';
import { 
  useFavorecidos, 
  useCreateFavorecido, 
  useUpdateFavorecido, 
  useDeleteFavorecido,
  useUploadFavorecidoPhoto 
} from '@/hooks/useCadastros';
import { 
  useCategoriesWithSubcategories, 
  useCreateCategory, 
  useDeleteCategory,
  useCreateSubcategories 
} from '@/hooks/useCategorias';
import type { FavorecidoTipo, FavorecidoInsert, FavorecidoUpdate } from '@/types/database';

export default function Cadastros() {
  const [activeTab, setActiveTab] = useState('favorecidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<FavorecidoTipo | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Mutations
  const createFavorecido = useCreateFavorecido();
  const updateFavorecido = useUpdateFavorecido();
  const deleteFavorecido = useDeleteFavorecido();
  const uploadPhoto = useUploadFavorecidoPhoto();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createSubcategories = useCreateSubcategories();

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
      setCategoryForm({ name: '', type: 'receita', color: '#3b82f6', subcategories: '' });
    } catch (error) {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFavorecido.mutateAsync(id);
      toast.success('Cadastro removido!');
    } catch (error) {
      toast.error('Erro ao remover cadastro');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Categoria removida!');
    } catch (error) {
      toast.error('Erro ao remover categoria');
    }
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
                          <input 
                            type="text" 
                            className="input-financial" 
                            placeholder="000.000.000-00"
                            value={formData.document}
                            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                          <input 
                            type="tel" 
                            className="input-financial" 
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                          <input 
                            type="text" 
                            className="input-financial" 
                            placeholder="00000-000"
                            value={formData.zip_code}
                            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
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
                        onClick={() => handleDelete(favorecido.id)}
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
                          onClick={() => handleDeleteCategory(categoria.id)}
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
