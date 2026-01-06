import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Ban,
  Repeat
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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
import { useBranchStore } from '@/stores';
import { 
  useFinancialEntries, 
  useFinancialSummary,
  useCreateFinancialEntry,
  useCreateFinancialEntries,
  useUpdateFinancialEntry,
  useDeleteFinancialEntries,
  useMarkAsPaid,
  useUpdateOverdueEntries,
  calculateRecurringDates
} from '@/hooks/useFinanceiro';
import { useCategories, useSubcategories } from '@/hooks/useCategorias';
import { useFavorecidos } from '@/hooks/useCadastros';
import { getBankAccounts } from '@/services/conciliacao';
import { exportToExcel, exportToCSV, parseExcel, parseCSV, parseXML, parseNFE } from '@/services/importExport';
import type { EntryType, EntryStatus, FinancialEntryInsert, RecurrenceType } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Financeiro() {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | EntryType>('todos');
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation dialog
  const { confirm, dialogProps } = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'receita' as EntryType,
    description: '',
    value: '',
    due_date: '',
    payment_date: '',
    status: 'pendente' as EntryStatus,
    category_id: '',
    subcategory_id: '',
    favorecido_id: '',
    bank_account_id: '',
    notes: '',
    is_recurring: false,
    recurrence_type: '' as RecurrenceType | '',
    recurrence_day: '',
    recurrence_end_date: '',
  });

  // Calculate date range for month filter
  const getMonthDateRange = (monthStr: string) => {
    if (!monthStr) return { startDate: undefined, endDate: undefined };
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  };

  const { startDate, endDate } = getMonthDateRange(filterMonth);

  // Fetch data
  const { data: entries, isLoading: entriesLoading } = useFinancialEntries({
    type: filterTipo === 'todos' ? undefined : filterTipo,
    search: searchTerm || undefined,
    startDate,
    endDate,
  });
  const { data: summary } = useFinancialSummary(undefined, startDate, endDate);
  const { data: categories } = useCategories();
  const { data: subcategories } = useSubcategories(formData.category_id);
  const { data: favorecidos } = useFavorecidos({ isActive: true });
  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts', unidadeAtual?.id],
    queryFn: () => getBankAccounts(unidadeAtual?.id),
    enabled: !!unidadeAtual?.id,
  });

  // Mutations
  const createEntry = useCreateFinancialEntry();
  const createEntries = useCreateFinancialEntries();
  const updateEntry = useUpdateFinancialEntry();
  const deleteEntries = useDeleteFinancialEntries();
  const markPaid = useMarkAsPaid();
  const updateOverdue = useUpdateOverdueEntries();

  // Auto-update overdue entries on page load
  useEffect(() => {
    if (unidadeAtual?.id) {
      updateOverdue.mutate();
    }
  }, [unidadeAtual?.id]);

  const filteredEntries = entries || [];

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEntries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntries.map(l => l.id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getStatusBadge = (status: EntryStatus) => {
    switch (status) {
      case 'pago':
        return <span className="badge-success">Pago</span>;
      case 'pendente':
        return <span className="badge-warning">Pendente</span>;
      case 'atrasado':
        return <span className="badge-danger">Atrasado</span>;
      case 'cancelado':
        return <span className="badge-neutral">Cancelado</span>;
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

    const entryData: FinancialEntryInsert = {
      branch_id: unidadeAtual.id,
      type: formData.type,
      description: formData.description,
      value: parseFloat(formData.value) || 0,
      due_date: formData.due_date,
      payment_date: formData.status === 'pago' ? (formData.payment_date || new Date().toISOString().split('T')[0]) : null,
      status: formData.status,
      category_id: formData.category_id || null,
      subcategory_id: formData.subcategory_id || null,
      favorecido_id: formData.favorecido_id || null,
      bank_account_id: formData.bank_account_id || null,
      notes: formData.notes || null,
      // Only include recurrence fields if recurring is enabled
      // These fields require migration 006_recurring_entries.sql to be executed
      ...(formData.is_recurring && {
        is_recurring: true,
        recurrence_type: formData.recurrence_type || null,
        recurrence_day: formData.recurrence_day ? parseInt(formData.recurrence_day) : null,
        recurrence_end_date: formData.recurrence_end_date || null,
        is_recurring_template: !editingId, // New recurring entries are templates
      }),
    };

    try {
      if (editingId) {
        await updateEntry.mutateAsync({ id: editingId, entry: entryData });
        toast.success('Lançamento atualizado!');
      } else {
        // Create the first entry (template for recurring)
        const createdEntry = await createEntry.mutateAsync(entryData);
        
        // If it's a recurring entry, generate entries for the next 12 months
        if (formData.is_recurring && formData.recurrence_type && !editingId) {
          const recurrenceDay = formData.recurrence_day ? parseInt(formData.recurrence_day) : null;
          const futureDates = calculateRecurringDates(
            formData.due_date,
            formData.recurrence_type,
            recurrenceDay,
            11 // 11 more entries to complete 12 months total
          );
          
          // Create entries for future dates
          const futureEntries: FinancialEntryInsert[] = futureDates.map(date => ({
            branch_id: unidadeAtual.id,
            type: formData.type,
            description: formData.description,
            value: parseFloat(formData.value) || 0,
            due_date: date,
            payment_date: null,
            status: 'pendente' as const,
            category_id: formData.category_id || null,
            subcategory_id: formData.subcategory_id || null,
            favorecido_id: formData.favorecido_id || null,
            bank_account_id: formData.bank_account_id || null,
            notes: formData.notes || null,
            is_recurring: true,
            recurrence_type: formData.recurrence_type as RecurrenceType,
            recurrence_day: recurrenceDay,
            recurrence_end_date: formData.recurrence_end_date || null,
            recurring_parent_id: createdEntry.id,
            is_recurring_template: false,
          }));
          
          if (futureEntries.length > 0) {
            await createEntries.mutateAsync(futureEntries);
          }
          
          toast.success(`Lançamento recorrente criado! ${futureEntries.length + 1} lançamentos gerados.`);
        } else {
          toast.success('Lançamento criado!');
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Erro ao salvar lançamento');
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;

    confirm(async () => {
      setIsDeleting(true);
      try {
        await deleteEntries.mutateAsync(selectedIds);
        toast.success(`${selectedIds.length} lançamento(s) excluído(s)`);
        setSelectedIds([]);
      } catch (error) {
        toast.error('Erro ao excluir lançamentos');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Excluir lançamentos',
      description: `Tem certeza que deseja excluir ${selectedIds.length} lançamento(s)? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
    });
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const data = filteredEntries.map(entry => ({
      'Tipo': entry.type === 'receita' ? 'Receita' : 'Despesa',
      'Descrição': entry.description,
      'Favorecido': entry.favorecido?.name || '',
      'Categoria': entry.category?.name || '',
      'Vencimento': formatDate(entry.due_date),
      'Valor': Number(entry.value),
      'Status': entry.status,
    }));

    if (format === 'xlsx') {
      exportToExcel(data, 'lancamentos');
    } else {
      exportToCSV(data, 'lancamentos');
    }
    toast.success('Arquivo exportado!');
  };

  const handleImportXML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !unidadeAtual?.id) return;

    try {
      const xmlDoc = await parseXML(file);
      const nfeData = parseNFE(xmlDoc);

      if (nfeData) {
        const entryData: FinancialEntryInsert = {
          branch_id: unidadeAtual.id,
          type: 'despesa',
          description: `NF-e ${nfeData.numero} - ${nfeData.emitente.nome}`,
          value: nfeData.valorTotal,
          due_date: nfeData.dataEmissao,
          document_number: nfeData.numero,
        };

        await createEntry.mutateAsync(entryData);
        toast.success('Nota fiscal importada!');
      } else {
        toast.error('Não foi possível ler a nota fiscal');
      }
    } catch (error) {
      toast.error('Erro ao importar XML');
    }

    e.target.value = '';
  };

  const resetForm = () => {
    setFormData({
      type: 'receita',
      description: '',
      value: '',
      due_date: '',
      payment_date: '',
      status: 'pendente',
      category_id: '',
      subcategory_id: '',
      favorecido_id: '',
      bank_account_id: '',
      notes: '',
      is_recurring: false,
      recurrence_type: '',
      recurrence_day: '',
      recurrence_end_date: '',
    });
    setEditingId(null);
  };

  const openEditModal = (entry: typeof filteredEntries[0]) => {
    setFormData({
      type: entry.type,
      description: entry.description,
      value: String(entry.value),
      due_date: entry.due_date,
      payment_date: entry.payment_date || '',
      status: entry.status,
      category_id: entry.category_id || '',
      subcategory_id: entry.subcategory_id || '',
      favorecido_id: entry.favorecido_id || '',
      bank_account_id: entry.bank_account_id || '',
      notes: entry.notes || '',
      is_recurring: entry.is_recurring || false,
      recurrence_type: entry.recurrence_type || '',
      recurrence_day: entry.recurrence_day?.toString() || '',
      recurrence_end_date: entry.recurrence_end_date || '',
    });
    setEditingId(entry.id);
    setIsModalOpen(true);
  };

  // Get selected category to check if it has default recurrence
  const selectedCategory = categories?.find(c => c.id === formData.category_id);

  // Apply category recurrence defaults when category changes
  useEffect(() => {
    if (selectedCategory?.is_recurring && !editingId) {
      setFormData(prev => ({
        ...prev,
        is_recurring: true,
        recurrence_type: selectedCategory.default_recurrence_type || prev.recurrence_type,
        recurrence_day: selectedCategory.default_recurrence_day?.toString() || prev.recurrence_day,
      }));
    }
  }, [formData.category_id, selectedCategory, editingId]);

  const handleMarkAsPaid = async (entryId: string) => {
    try {
      await markPaid.mutateAsync({ id: entryId });
      toast.success('Lançamento marcado como pago!');
    } catch (error) {
      toast.error('Erro ao marcar como pago');
    }
  };

  const handleCancelEntry = (entryId: string, description: string) => {
    confirm(async () => {
      setIsDeleting(true);
      try {
        await updateEntry.mutateAsync({ 
          id: entryId, 
          entry: { status: 'cancelado' } 
        });
        toast.success('Lançamento cancelado!');
      } catch (error) {
        toast.error('Erro ao cancelar lançamento');
      } finally {
        setIsDeleting(false);
      }
    }, {
      title: 'Cancelar lançamento',
      description: `Tem certeza que deseja cancelar o lançamento "${description}"?`,
      confirmText: 'Cancelar lançamento',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie contas a pagar e receber</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="btn-secondary cursor-pointer">
              <Download className="w-4 h-4" />
              Importar XML
              <input type="file" accept=".xml" className="hidden" onChange={handleImportXML} />
            </label>
            <div className="relative group">
              <button className="btn-secondary">
                <Upload className="w-4 h-4" />
                Exportar
              </button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExport('xlsx')} className="block w-full px-4 py-2 text-sm text-left hover:bg-muted">
                  Excel (.xlsx)
                </button>
                <button onClick={() => handleExport('csv')} className="block w-full px-4 py-2 text-sm text-left hover:bg-muted">
                  CSV (.csv)
                </button>
              </div>
            </div>
            <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <button className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Novo Lançamento
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para {editingId ? 'atualizar o' : 'criar um novo'} lançamento financeiro.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                      <select 
                        className="input-financial" 
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as EntryType })}
                      >
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Valor</label>
                      <CurrencyInput
                        value={formData.value}
                        onChange={(numValue, formatted) => setFormData({ ...formData, value: String(numValue) })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                      <select 
                        className="input-financial" 
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as EntryStatus })}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="atrasado">Atrasado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  {formData.status === 'pago' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Data do Pagamento</label>
                      <input 
                        type="date" 
                        className="input-financial" 
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                    <input 
                      type="text" 
                      className="input-financial" 
                      placeholder="Descrição do lançamento" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Data Vencimento</label>
                      <input 
                        type="date" 
                        className="input-financial" 
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Favorecido</label>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                      <select 
                        className="input-financial"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                      >
                        <option value="">Selecione</option>
                        {categories?.filter(c => c.type === formData.type || c.type === 'ambos').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Subcategoria</label>
                      <select 
                        className="input-financial"
                        value={formData.subcategory_id}
                        onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                        disabled={!formData.category_id}
                      >
                        <option value="">Selecione</option>
                        {subcategories?.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Conta Bancária</label>
                    <select 
                      className="input-financial"
                      value={formData.bank_account_id}
                      onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                    >
                      <option value="">Selecione</option>
                      {bankAccounts?.map(b => (
                        <option key={b.id} value={b.id}>{b.name} - {b.bank_name}</option>
                      ))}
                    </select>
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

                  {/* Recurrence Settings */}
                  <div className="border-t border-border pt-4 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_recurring}
                        onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                        className="w-4 h-4 rounded border-input"
                      />
                      <Repeat className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Lançamento recorrente</span>
                    </label>
                    {selectedCategory?.is_recurring && (
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        Categoria com recorrência padrão aplicada
                      </p>
                    )}

                    {formData.is_recurring && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Tipo de Recorrência</label>
                          <select 
                            className="input-financial"
                            value={formData.recurrence_type}
                            onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as RecurrenceType | '' })}
                            required={formData.is_recurring}
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
                            {formData.recurrence_type === 'semanal' ? 'Dia da Semana' : 'Dia do Mês'}
                          </label>
                          {formData.recurrence_type === 'semanal' ? (
                            <select 
                              className="input-financial"
                              value={formData.recurrence_day}
                              onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
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
                              value={formData.recurrence_day}
                              onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Data Fim (opcional)</label>
                          <input 
                            type="date" 
                            className="input-financial" 
                            value={formData.recurrence_end_date}
                            onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={createEntry.isPending || updateEntry.isPending}
                    >
                      {(createEntry.isPending || updateEntry.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingId ? 'Atualizar' : 'Salvar'} Lançamento
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card stat-card-income">
            <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
            <p className="text-xl font-bold font-mono-numbers text-income mt-1">
              {formatCurrency(summary?.totalReceitas || 0)}
            </p>
          </div>
          <div className="stat-card stat-card-expense">
            <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
            <p className="text-xl font-bold font-mono-numbers text-expense mt-1">
              {formatCurrency(summary?.totalDespesas || 0)}
            </p>
          </div>
          <div className="stat-card stat-card-primary">
            <p className="text-sm font-medium text-muted-foreground">Saldo</p>
            <p className={`text-xl font-bold font-mono-numbers mt-1 ${(summary?.saldo || 0) >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(summary?.saldo || 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card-financial p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por descrição, favorecido, categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-financial pl-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="input-financial w-auto"
              />
              <button
                onClick={() => setFilterMonth('')}
                className={!filterMonth ? 'btn-primary' : 'btn-secondary'}
                title="Mostrar todos os meses"
              >
                Todos
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterTipo('todos')}
                className={filterTipo === 'todos' ? 'btn-primary' : 'btn-secondary'}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterTipo('receita')}
                className={filterTipo === 'receita' ? 'btn-success' : 'btn-secondary'}
              >
                Receitas
              </button>
              <button
                onClick={() => setFilterTipo('despesa')}
                className={filterTipo === 'despesa' ? 'btn-destructive' : 'btn-secondary'}
              >
                Despesas
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons when items selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-fade-in">
            <span className="text-sm font-medium text-foreground">{selectedIds.length} item(s) selecionado(s)</span>
            <div className="flex gap-2 ml-auto">
              <button 
                className="btn-destructive"
                onClick={handleDelete}
                disabled={deleteEntries.isPending}
              >
                {deleteEntries.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Excluir
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card-financial overflow-hidden">
          {entriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table-financial">
                  <thead>
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredEntries.length && filteredEntries.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-input"
                        />
                      </th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Favorecido</th>
                      <th>Categoria</th>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground">
                          Nenhum lançamento encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id} className="group">
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(entry.id)}
                              onChange={() => handleSelect(entry.id)}
                              className="w-4 h-4 rounded border-input"
                            />
                          </td>
                          <td>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              entry.type === 'receita' ? 'bg-income-muted' : 'bg-expense-muted'
                            }`}>
                              {entry.type === 'receita' ? (
                                <ArrowUpRight className="w-4 h-4 text-income" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-expense" />
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{entry.description}</p>
                              {entry.is_recurring && (
                                <Repeat className="w-3 h-3 text-muted-foreground" aria-label="Lançamento recorrente" />
                              )}
                            </div>
                          </td>
                          <td className="text-foreground">{entry.favorecido?.name || '-'}</td>
                          <td>
                            <span className="text-foreground">{entry.category?.name || '-'}</span>
                          </td>
                          <td className="text-foreground">{formatDate(entry.due_date)}</td>
                          <td>
                            <span className={`font-mono-numbers font-semibold ${
                              entry.type === 'receita' ? 'text-income' : 'text-expense'
                            }`}>
                              {entry.type === 'receita' ? '+' : '-'}{formatCurrency(Number(entry.value))}
                            </span>
                          </td>
                          <td>{getStatusBadge(entry.status)}</td>
                          <td>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {entry.status === 'pendente' && (
                                <button 
                                  className="p-2 hover:bg-income/10 rounded-lg"
                                  onClick={() => handleMarkAsPaid(entry.id)}
                                  title="Marcar como pago"
                                  disabled={markPaid.isPending}
                                >
                                  <Check className="w-4 h-4 text-income" />
                                </button>
                              )}
                              {(entry.status === 'pendente' || entry.status === 'atrasado') && (
                                <button 
                                  className="p-2 hover:bg-muted rounded-lg"
                                  onClick={() => handleCancelEntry(entry.id, entry.description)}
                                  title="Cancelar"
                                  disabled={updateEntry.isPending}
                                >
                                  <Ban className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                              <button 
                                className="p-2 hover:bg-muted rounded-lg"
                                onClick={() => openEditModal(entry)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredEntries.length} lançamentos
                </p>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary p-2" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-foreground px-3">1</span>
                  <button className="btn-secondary p-2" disabled>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
    </AppLayout>
  );
}
