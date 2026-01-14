import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Printer,
  Eye,
  Edit,
  Trash2,
  Upload,
  PenTool,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { useAuthStore, useBranchStore } from '@/stores';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getContracts, 
  createContract, 
  updateContract, 
  deleteContract,
  uploadContractFile,
  deleteContractFile,
  signContract,
  getContractsSummary,
  ContractFilters 
} from '@/services/contratos';
import { useFavorecidos } from '@/hooks/useCadastros';
import type { ContractInsert, ContractStatus } from '@/types/database';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Contratos() {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingContractId, setUploadingContractId] = useState<string | null>(null);
  
  // Confirmation dialog
  const { confirm, dialogProps } = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    favorecido_id: '',
    type: '',
    value: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  // Fetch data
  const filters: ContractFilters = {
    branchId: unidadeAtual?.id,
    search: searchTerm || undefined,
  };

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => getContracts(filters),
    enabled: !!unidadeAtual?.id,
  });

  const { data: summary } = useQuery({
    queryKey: ['contracts-summary', unidadeAtual?.id],
    queryFn: () => getContractsSummary(unidadeAtual!.id),
    enabled: !!unidadeAtual?.id,
  });

  const { data: favorecidos } = useFavorecidos({ isActive: true });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateContract(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const signMutation = useMutation({
    mutationFn: signContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ contractId, file }: { contractId: string; file: File }) => 
      uploadContractFile(contractId, file, user?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteContractFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const filteredContratos = contracts || [];

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'ativo':
        return <span className="badge-success">Ativo</span>;
      case 'pendente':
        return <span className="badge-warning">Pendente Assinatura</span>;
      case 'encerrado':
        return <span className="badge-neutral">Encerrado</span>;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeAtual?.id) {
      toast.error('Selecione uma filial');
      return;
    }

    const contractData: ContractInsert = {
      branch_id: unidadeAtual.id,
      title: formData.title,
      favorecido_id: formData.favorecido_id || null,
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      start_date: formData.start_date,
      end_date: formData.end_date,
      notes: formData.notes || null,
      created_by: user?.id,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: contractData });
        toast.success('Venda atualizada!');
      } else {
        await createMutation.mutateAsync(contractData);
        toast.success('Venda criada!');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar venda');
    }
  };

  const handleDelete = (id: string, title: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Venda excluída!');
        setSelectedContrato(null);
      } catch (error) {
        toast.error('Erro ao excluir venda');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Excluir venda',
      description: `Tem certeza que deseja excluir a venda "${title}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
    });
  };

  const handleSign = async (id: string) => {
    try {
      await signMutation.mutateAsync(id);
      toast.success('Venda confirmada!');
    } catch (error) {
      toast.error('Erro ao confirmar venda');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, contractId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadFileMutation.mutateAsync({ contractId, file });
      toast.success('Arquivo anexado!');
    } catch (error) {
      toast.error('Erro ao anexar arquivo');
    }
    
    e.target.value = '';
    setUploadingContractId(null);
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteFileMutation.mutateAsync(fileId);
        toast.success('Arquivo removido!');
      } catch (error) {
        toast.error('Erro ao remover arquivo');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Remover arquivo',
      description: `Tem certeza que deseja remover o arquivo "${fileName}"?`,
      confirmText: 'Remover',
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      favorecido_id: '',
      type: '',
      value: '',
      start_date: '',
      end_date: '',
      notes: '',
    });
    setEditingId(null);
  };

  const openEditModal = (contrato: any) => {
    setFormData({
      title: contrato.title,
      favorecido_id: contrato.favorecido_id || '',
      type: contrato.type,
      value: String(contrato.value),
      start_date: contrato.start_date,
      end_date: contrato.end_date,
      notes: contrato.notes || '',
    });
    setEditingId(contrato.id);
    setIsModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
            <p className="text-muted-foreground">Gerencie vendas e produtos</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Nova Venda
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados para {editingId ? 'atualizar a' : 'criar uma nova'} venda.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Título da Venda/Produto *</label>
                  <input 
                    type="text" 
                    className="input-financial" 
                    placeholder="Ex: Venda de Produto X"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cliente/Favorecido</label>
                    <select 
                      className="input-financial"
                      value={formData.favorecido_id}
                      onChange={(e) => setFormData({ ...formData, favorecido_id: e.target.value })}
                    >
                      <option value="">Selecione</option>
                      {favorecidos?.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tipo *</label>
                    <select 
                      className="input-financial"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="Prestação de Serviços">Prestação de Serviços</option>
                      <option value="Fornecimento">Fornecimento</option>
                      <option value="Parceria">Parceria</option>
                      <option value="Locação">Locação</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Valor Total *</label>
                    <CurrencyInput
                      value={formData.value}
                      onChange={(numValue) => setFormData({ ...formData, value: String(numValue) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Data Início *</label>
                    <input 
                      type="date" 
                      className="input-financial"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Data Fim *</label>
                    <input 
                      type="date" 
                      className="input-financial"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                  <textarea 
                    className="input-financial min-h-[80px]" 
                    placeholder="Informações adicionais do contrato"
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                    <FileText className="w-4 h-4" />
                    {editingId ? 'Atualizar' : 'Criar'} Venda
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card stat-card-primary">
            <p className="text-sm text-muted-foreground">Total de Vendas</p>
            <p className="text-2xl font-bold text-foreground">{summary?.total || 0}</p>
          </div>
          <div className="stat-card stat-card-income">
            <p className="text-sm text-muted-foreground">Vendas Ativas</p>
            <p className="text-2xl font-bold text-income">{summary?.active || 0}</p>
          </div>
          <div className="stat-card stat-card-pending">
            <p className="text-sm text-muted-foreground">Pendentes Assinatura</p>
            <p className="text-2xl font-bold text-pending">{summary?.pending || 0}</p>
          </div>
          <div className="stat-card stat-card-expense">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-xl font-bold font-mono-numbers text-foreground">
              {formatCurrency(summary?.totalValue || 0)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="card-financial p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título, cliente, produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-financial pl-11"
            />
          </div>
        </div>

        {/* Contracts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContratos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma venda encontrada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredContratos.map((contrato) => (
              <div key={contrato.id} className="card-financial p-5 group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{contrato.title}</h3>
                        {getStatusBadge(contrato.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {contrato.favorecido && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {contrato.favorecido.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(contrato.start_date)} - {formatDate(contrato.end_date)}
                        </span>
                        <span className="font-mono-numbers font-medium text-foreground">
                          {formatCurrency(Number(contrato.value))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contrato.files?.length || 0} arquivo(s) anexado(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      className="btn-secondary p-2" 
                      onClick={() => setSelectedContrato(contrato)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className="btn-secondary p-2"
                      onClick={() => openEditModal(contrato)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(e, uploadingContractId || contrato.id)}
                    />
                    <button 
                      className="btn-secondary p-2"
                      onClick={() => {
                        setUploadingContractId(contrato.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    {contrato.status === 'pendente' && (
                      <button 
                        className="btn-primary"
                        onClick={() => handleSign(contrato.id)}
                        disabled={signMutation.isPending}
                      >
                        {signMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                        Assinar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Detail Dialog */}
      <Dialog open={!!selectedContrato} onOpenChange={() => setSelectedContrato(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedContrato?.title}</DialogTitle>
            <DialogDescription>
              Detalhes da venda
            </DialogDescription>
          </DialogHeader>
          {selectedContrato && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{selectedContrato.favorecido?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium text-foreground">{selectedContrato.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-mono-numbers font-semibold text-foreground">{formatCurrency(Number(selectedContrato.value))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedContrato.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-medium text-foreground">{formatDate(selectedContrato.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Término</p>
                  <p className="font-medium text-foreground">{formatDate(selectedContrato.end_date)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Arquivos Anexados</p>
                <div className="space-y-2">
                  {selectedContrato.files?.length > 0 ? (
                    selectedContrato.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{file.file_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={file.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-secondary p-1"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            className="btn-secondary p-1 text-destructive"
                            onClick={() => handleDeleteFile(file.id, file.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum arquivo anexado</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => openEditModal(selectedContrato)}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  className="btn-destructive flex-1"
                  onClick={() => handleDelete(selectedContrato.id, selectedContrato.title)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Excluir
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
    </AppLayout>
  );
}
