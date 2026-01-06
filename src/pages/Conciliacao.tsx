import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  Building2, 
  Check, 
  X, 
  Link2,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import { useAuthStore, useBranchStore } from '@/stores';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBankAccounts, 
  getBankStatements,
  createReconciliation,
  deleteReconciliation,
  getReconciliationSummary,
  findMatchCandidates,
  importBankStatements,
  getUnreconciledEntries
} from '@/services/conciliacao';
import { createFinancialEntry } from '@/services/financeiro';
import { parseExcel, parseCSV, parseBankStatement, exportToExcel } from '@/services/importExport';
import { useCategories } from '@/hooks/useCategorias';
import { useFavorecidos } from '@/hooks/useCadastros';
import type { EntryType, FinancialEntryInsert } from '@/types/database';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Conciliacao() {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBanco, setSelectedBanco] = useState<string | null>(null);
  const [selectedExtrato, setSelectedExtrato] = useState<string | null>(null);
  const [selectedLancamento, setSelectedLancamento] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createAndReconcile, setCreateAndReconcile] = useState(true);

  // Form state for new entry
  const [newEntryForm, setNewEntryForm] = useState({
    type: 'despesa' as EntryType,
    description: '',
    value: '',
    due_date: '',
    category_id: '',
    favorecido_id: '',
    notes: '',
  });

  // Fetch bank accounts
  const { data: bankAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank-accounts', unidadeAtual?.id],
    queryFn: () => getBankAccounts(unidadeAtual?.id),
    enabled: !!unidadeAtual?.id,
  });

  // Set default bank when accounts load
  if (bankAccounts?.length && !selectedBanco) {
    setSelectedBanco(bankAccounts[0].id);
  }

  // Fetch statements for selected bank
  const { data: statements, isLoading: statementsLoading } = useQuery({
    queryKey: ['bank-statements', selectedBanco],
    queryFn: () => getBankStatements(selectedBanco!),
    enabled: !!selectedBanco,
  });

  // Fetch unreconciled entries
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['unreconciled-entries', unidadeAtual?.id],
    queryFn: () => getUnreconciledEntries(unidadeAtual!.id),
    enabled: !!unidadeAtual?.id,
  });

  // Fetch reconciliation summary
  const { data: summary } = useQuery({
    queryKey: ['reconciliation-summary', selectedBanco],
    queryFn: () => getReconciliationSummary(selectedBanco!),
    enabled: !!selectedBanco,
  });

  // Find match candidates
  const { data: matchCandidates } = useQuery({
    queryKey: ['match-candidates', selectedBanco, unidadeAtual?.id],
    queryFn: () => findMatchCandidates(selectedBanco!, unidadeAtual!.id),
    enabled: !!selectedBanco && !!unidadeAtual?.id,
  });

  // Fetch categories and favorecidos for the create entry form
  const { data: categories } = useCategories();
  const { data: favorecidos } = useFavorecidos({ isActive: true });

  // Get selected statement for creating entry
  const selectedStatement = statements?.find(s => s.id === selectedExtrato);

  // Reconcile mutation
  const reconcileMutation = useMutation({
    mutationFn: ({ statementId, entryId }: { statementId: string; entryId: string }) =>
      createReconciliation(statementId, entryId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['unreconciled-entries'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
      queryClient.invalidateQueries({ queryKey: ['match-candidates'] });
      setSelectedExtrato(null);
      setSelectedLancamento(null);
    },
  });

  // Unreconcile mutation
  const unreconciledMutation = useMutation({
    mutationFn: deleteReconciliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['unreconciled-entries'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
    },
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: { entry: FinancialEntryInsert; statementId: string; reconcile: boolean }) => {
      const newEntry = await createFinancialEntry(data.entry);
      
      // If should reconcile, create the reconciliation link
      if (data.reconcile && data.statementId) {
        await createReconciliation(data.statementId, newEntry.id, user?.id);
      }
      
      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['unreconciled-entries'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
      queryClient.invalidateQueries({ queryKey: ['match-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
    },
  });

  const handleConciliar = async () => {
    if (!selectedExtrato || !selectedLancamento) return;

    try {
      await reconcileMutation.mutateAsync({
        statementId: selectedExtrato,
        entryId: selectedLancamento,
      });
      toast.success('Itens conciliados com sucesso!');
    } catch (error) {
      toast.error('Erro ao conciliar itens');
    }
  };

  const handleAutoMatch = async () => {
    if (!matchCandidates?.length) {
      toast.info('Nenhuma correspondência automática encontrada');
      return;
    }

    let matchedCount = 0;
    for (const match of matchCandidates) {
      try {
        await reconcileMutation.mutateAsync({
          statementId: match.statementId,
          entryId: match.entryId,
        });
        matchedCount++;
      } catch (error) {
        console.error('Error matching:', error);
      }
    }

    toast.success(`${matchedCount} item(s) conciliado(s) automaticamente!`);
  };

  // Open modal to create entry from statement
  const handleOpenCreateModal = () => {
    if (!selectedStatement) {
      toast.error('Selecione um item do extrato primeiro');
      return;
    }

    // Pre-fill form based on statement data
    const entryType: EntryType = selectedStatement.type === 'credito' ? 'receita' : 'despesa';
    
    setNewEntryForm({
      type: entryType,
      description: selectedStatement.description,
      value: String(Math.abs(Number(selectedStatement.value))),
      due_date: selectedStatement.date,
      category_id: '',
      favorecido_id: '',
      notes: `Criado a partir do extrato bancário em ${formatDate(selectedStatement.date)}`,
    });
    
    setCreateAndReconcile(true);
    setIsCreateModalOpen(true);
  };

  // Handle create entry form submission
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unidadeAtual?.id) {
      toast.error('Selecione uma filial');
      return;
    }

    const entryData: FinancialEntryInsert = {
      branch_id: unidadeAtual.id,
      type: newEntryForm.type,
      description: newEntryForm.description,
      value: parseFloat(newEntryForm.value) || 0,
      due_date: newEntryForm.due_date,
      status: 'pago', // Entries from statements are usually already paid
      payment_date: newEntryForm.due_date,
      category_id: newEntryForm.category_id || null,
      favorecido_id: newEntryForm.favorecido_id || null,
      bank_account_id: selectedBanco,
      notes: newEntryForm.notes || null,
    };

    try {
      await createEntryMutation.mutateAsync({
        entry: entryData,
        statementId: selectedExtrato || '',
        reconcile: createAndReconcile && !!selectedExtrato,
      });
      
      toast.success(
        createAndReconcile 
          ? 'Lançamento criado e conciliado!' 
          : 'Lançamento criado!'
      );
      
      setIsCreateModalOpen(false);
      setSelectedExtrato(null);
      resetCreateForm();
    } catch (error) {
      toast.error('Erro ao criar lançamento');
    }
  };

  const resetCreateForm = () => {
    setNewEntryForm({
      type: 'despesa',
      description: '',
      value: '',
      due_date: '',
      category_id: '',
      favorecido_id: '',
      notes: '',
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBanco) return;

    setIsImporting(true);
    
    try {
      let rows;
      if (file.name.endsWith('.csv')) {
        rows = await parseCSV(file);
      } else {
        rows = await parseExcel(file);
      }

      // Simple column mapping - adjust based on your bank's format
      const mapping = {
        date: Object.keys(rows[0] || {}).find(k => 
          k.toLowerCase().includes('data') || k.toLowerCase().includes('date')
        ) || 'Data',
        description: Object.keys(rows[0] || {}).find(k => 
          k.toLowerCase().includes('descri') || k.toLowerCase().includes('histórico') || k.toLowerCase().includes('lancamento')
        ) || 'Descrição',
        value: Object.keys(rows[0] || {}).find(k => 
          k.toLowerCase().includes('valor') || k.toLowerCase().includes('amount')
        ) || 'Valor',
        type: Object.keys(rows[0] || {}).find(k => 
          k.toLowerCase().includes('tipo') || k.toLowerCase().includes('d/c')
        ),
      };

      const parsedRows = parseBankStatement(rows, mapping);
      
      if (parsedRows.length === 0) {
        toast.error('Nenhum registro válido encontrado no arquivo');
        return;
      }

      const result = await importBankStatements(selectedBanco, parsedRows);
      
      if (result.imported > 0) {
        toast.success(`${result.imported} registro(s) importado(s)!`);
        queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      }

      if (result.errors > 0) {
        toast.warning(`${result.errors} registro(s) com erro`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro ao importar arquivo');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = () => {
    const data = (statements || []).map(s => ({
      'Data': formatDate(s.date),
      'Descrição': s.description,
      'Tipo': s.type === 'credito' ? 'Crédito' : 'Débito',
      'Valor': Number(s.value),
      'Status': s.reconciliation_status === 'conciliado' ? 'Conciliado' : 'Pendente',
    }));

    exportToExcel(data, 'extrato-bancario');
    toast.success('Extrato exportado!');
  };

  const currentBank = bankAccounts?.find(b => b.id === selectedBanco);
  const conciliadosCount = summary?.reconciled || 0;
  const pendentesCount = summary?.pending || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conciliação Bancária</h1>
            <p className="text-muted-foreground">Concilie extratos bancários com lançamentos</p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
            />
            <button 
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedBanco || isImporting}
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Importar Extrato
            </button>
            <button className="btn-secondary" onClick={handleExport} disabled={!statements?.length}>
              <Upload className="w-4 h-4" />
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* Bank Selection */}
        {accountsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts?.map((banco) => (
              <button
                key={banco.id}
                onClick={() => setSelectedBanco(banco.id)}
                className={`card-financial p-4 text-left transition-all ${
                  selectedBanco === banco.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedBanco === banco.id ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Building2 className={`w-5 h-5 ${
                      selectedBanco === banco.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{banco.name}</p>
                    <p className="text-sm font-mono-numbers text-muted-foreground">
                      Saldo: {formatCurrency(Number(banco.current_balance))}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {!bankAccounts?.length && (
              <p className="text-muted-foreground col-span-3 text-center py-4">
                Nenhuma conta bancária cadastrada
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {selectedBanco && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card stat-card-income">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-income" />
                <div>
                  <p className="text-sm text-muted-foreground">Conciliados</p>
                  <p className="text-xl font-bold text-income">{conciliadosCount} itens</p>
                </div>
              </div>
            </div>
            <div className="stat-card stat-card-pending">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-pending" />
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold text-pending">{pendentesCount} itens</p>
                </div>
              </div>
            </div>
            <div className="stat-card stat-card-primary">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conciliação</p>
                  <p className="text-xl font-bold text-primary">
                    {summary?.reconciliationRate.toFixed(0) || 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <button 
                className="btn-primary w-full"
                onClick={handleAutoMatch}
                disabled={!matchCandidates?.length || reconcileMutation.isPending}
              >
                <Link2 className="w-4 h-4" />
                Conciliar Automático ({matchCandidates?.length || 0})
              </button>
            </div>
          </div>
        )}

        {/* Conciliation Action */}
        {(selectedExtrato || selectedLancamento) && (
          <div className="card-financial p-4 bg-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link2 className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">
                  {selectedExtrato && selectedLancamento 
                    ? 'Clique em "Conciliar" para vincular os itens selecionados'
                    : selectedExtrato && !selectedLancamento
                      ? 'Selecione um lançamento para conciliar ou crie um novo'
                      : 'Selecione um item do extrato e um lançamento para conciliar'}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn-secondary"
                  onClick={() => { setSelectedExtrato(null); setSelectedLancamento(null); }}
                >
                  Cancelar
                </button>
                {selectedExtrato && !selectedLancamento && (
                  <button 
                    className="btn-secondary"
                    onClick={handleOpenCreateModal}
                  >
                    <Plus className="w-4 h-4" />
                    Criar Lançamento
                  </button>
                )}
                <button 
                  className="btn-primary"
                  disabled={!selectedExtrato || !selectedLancamento || reconcileMutation.isPending}
                  onClick={handleConciliar}
                >
                  {reconcileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Conciliar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        {selectedBanco && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extrato */}
            <div className="card-financial overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground">Extrato Bancário</h3>
                <p className="text-sm text-muted-foreground">{currentBank?.bank_name}</p>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {statementsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !statements?.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum extrato importado</p>
                    <button 
                      className="btn-secondary mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Download className="w-4 h-4" />
                      Importar Extrato
                    </button>
                  </div>
                ) : (
                  statements.map((item) => {
                    const isReconciled = item.reconciliation_status === 'conciliado';
                    const isSelected = selectedExtrato === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isReconciled && setSelectedExtrato(item.id)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors group ${
                          isReconciled 
                            ? 'bg-income-muted/30 cursor-default' 
                            : isSelected 
                              ? 'bg-primary/10' 
                              : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isReconciled ? 'bg-income/20' : 'bg-muted'
                          }`}>
                            {isReconciled ? (
                              <Check className="w-4 h-4 text-income" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isReconciled && isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateModal();
                              }}
                              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                              title="Criar lançamento a partir deste item"
                            >
                              <Plus className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          <p className={`font-mono-numbers font-semibold ${
                            item.type === 'credito' ? 'text-income' : 'text-expense'
                          }`}>
                            {item.type === 'credito' ? '+' : '-'}{formatCurrency(Number(item.value))}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Lançamentos */}
            <div className="card-financial overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground">Lançamentos do Sistema</h3>
                <p className="text-sm text-muted-foreground">Não conciliados</p>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {entriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !entries?.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Todos os lançamentos foram conciliados</p>
                  </div>
                ) : (
                  entries.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLancamento(item.id)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        selectedLancamento === item.id 
                          ? 'bg-primary/10' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.due_date)}</p>
                        </div>
                      </div>
                      <p className={`font-mono-numbers font-semibold ${
                        item.type === 'receita' ? 'text-income' : 'text-expense'
                      }`}>
                        {item.type === 'receita' ? '+' : '-'}{formatCurrency(Number(item.value))}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Entry Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) resetCreateForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Lançamento</DialogTitle>
              <DialogDescription>
                Crie um novo lançamento a partir do item do extrato selecionado.
              </DialogDescription>
            </DialogHeader>

            {selectedStatement && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedStatement.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(selectedStatement.date)}</p>
                  </div>
                  <p className={`font-mono-numbers font-semibold ${
                    selectedStatement.type === 'credito' ? 'text-income' : 'text-expense'
                  }`}>
                    {selectedStatement.type === 'credito' ? '+' : '-'}{formatCurrency(Number(selectedStatement.value))}
                  </p>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreateEntry}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                  <select 
                    className="input-financial" 
                    value={newEntryForm.type}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, type: e.target.value as EntryType })}
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valor</label>
                  <CurrencyInput
                    value={newEntryForm.value}
                    onChange={(numValue) => setNewEntryForm({ ...newEntryForm, value: String(numValue) })}
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
                  value={newEntryForm.description}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data</label>
                  <input 
                    type="date" 
                    className="input-financial" 
                    value={newEntryForm.due_date}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, due_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                  <select 
                    className="input-financial"
                    value={newEntryForm.category_id}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, category_id: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    {categories?.filter(c => c.type === newEntryForm.type || c.type === 'ambos').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Favorecido</label>
                <select 
                  className="input-financial"
                  value={newEntryForm.favorecido_id}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, favorecido_id: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {favorecidos?.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                <textarea 
                  className="input-financial min-h-[60px]" 
                  placeholder="Observações adicionais"
                  value={newEntryForm.notes}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, notes: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-income-muted/50 rounded-lg border border-income/20">
                  <input 
                    type="checkbox" 
                    checked={createAndReconcile}
                    onChange={(e) => setCreateAndReconcile(e.target.checked)}
                    className="w-4 h-4 rounded border-input text-income"
                  />
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-income" />
                    <span className="text-sm font-medium text-foreground">Conciliar automaticamente após criar</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={createEntryMutation.isPending}
                >
                  {createEntryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {createAndReconcile ? 'Criar e Conciliar' : 'Criar Lançamento'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
