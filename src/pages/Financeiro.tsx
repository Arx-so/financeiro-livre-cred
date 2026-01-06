import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Loader2
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
import { toast } from 'sonner';
import { useBranchStore } from '@/stores';
import { 
  useFinancialEntries, 
  useFinancialSummary,
  useCreateFinancialEntry,
  useUpdateFinancialEntry,
  useDeleteFinancialEntries,
  useMarkAsPaid 
} from '@/hooks/useFinanceiro';
import { useCategories, useSubcategories } from '@/hooks/useCategorias';
import { useFavorecidos } from '@/hooks/useCadastros';
import { getBankAccounts } from '@/services/conciliacao';
import { exportToExcel, exportToCSV, parseExcel, parseCSV, parseXML, parseNFE } from '@/services/importExport';
import type { EntryType, EntryStatus, FinancialEntryInsert } from '@/types/database';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'receita' as EntryType,
    description: '',
    value: '',
    due_date: '',
    category_id: '',
    subcategory_id: '',
    favorecido_id: '',
    bank_account_id: '',
    notes: '',
  });

  // Fetch data
  const { data: entries, isLoading: entriesLoading } = useFinancialEntries({
    type: filterTipo === 'todos' ? undefined : filterTipo,
    search: searchTerm || undefined,
  });
  const { data: summary } = useFinancialSummary();
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
  const updateEntry = useUpdateFinancialEntry();
  const deleteEntries = useDeleteFinancialEntries();
  const markPaid = useMarkAsPaid();

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
      value: parseFloat(formData.value.replace(/[^\d,-]/g, '').replace(',', '.')),
      due_date: formData.due_date,
      category_id: formData.category_id || null,
      subcategory_id: formData.subcategory_id || null,
      favorecido_id: formData.favorecido_id || null,
      bank_account_id: formData.bank_account_id || null,
      notes: formData.notes || null,
    };

    try {
      if (editingId) {
        await updateEntry.mutateAsync({ id: editingId, entry: entryData });
        toast.success('Lançamento atualizado!');
      } else {
        await createEntry.mutateAsync(entryData);
        toast.success('Lançamento criado!');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar lançamento');
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await deleteEntries.mutateAsync(selectedIds);
      toast.success(`${selectedIds.length} lançamento(s) excluído(s)`);
      setSelectedIds([]);
    } catch (error) {
      toast.error('Erro ao excluir lançamentos');
    }
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
      category_id: '',
      subcategory_id: '',
      favorecido_id: '',
      bank_account_id: '',
      notes: '',
    });
    setEditingId(null);
  };

  const openEditModal = (entry: typeof filteredEntries[0]) => {
    setFormData({
      type: entry.type,
      description: entry.description,
      value: String(entry.value),
      due_date: entry.due_date,
      category_id: entry.category_id || '',
      subcategory_id: entry.subcategory_id || '',
      favorecido_id: entry.favorecido_id || '',
      bank_account_id: entry.bank_account_id || '',
      notes: entry.notes || '',
    });
    setEditingId(entry.id);
    setIsModalOpen(true);
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
              <Upload className="w-4 h-4" />
              Importar XML
              <input type="file" accept=".xml" className="hidden" onChange={handleImportXML} />
            </label>
            <div className="relative group">
              <button className="btn-secondary">
                <Download className="w-4 h-4" />
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <input 
                        type="text" 
                        className="input-financial font-mono-numbers" 
                        placeholder="R$ 0,00" 
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        required
                      />
                    </div>
                  </div>
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
                            <p className="font-medium text-foreground">{entry.description}</p>
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
                            <button 
                              className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => openEditModal(entry)}
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
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
    </AppLayout>
  );
}
