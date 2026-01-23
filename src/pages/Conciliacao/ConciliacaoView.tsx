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
    ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
    PageHeader, EmptyState, LoadingState, StatCard
} from '@/components/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { useConciliacaoPage } from './useConciliacaoPage';
import type { EntryType } from '@/types/database';

type ConciliacaoViewProps = ReturnType<typeof useConciliacaoPage>;

export function ConciliacaoView(props: ConciliacaoViewProps) {
    const {
        // Refs
        fileInputRef,
        // Selection state
        selectedBanco,
        setSelectedBanco,
        selectedExtrato,
        setSelectedExtrato,
        selectedLancamento,
        setSelectedLancamento,
        // UI state
        isImporting,
        isCreateModalOpen,
        setIsCreateModalOpen,
        createAndReconcile,
        setCreateAndReconcile,
        // Form state
        newEntryForm,
        setNewEntryForm,
        resetNewEntryForm,
        // Data
        bankAccounts,
        unreconciledStatements,
        reconciledStatements,
        statementsLoading,
        entries,
        entriesLoading,
        summary,
        matchCandidates,
        categories,
        favorecidos,
        // Mutation states
        isReconciling,
        isUnreconciling,
        isCreatingEntry,
        // Handlers
        handleReconcile,
        handleUnreconcile,
        handleImport,
        handleExport,
        openCreateModal,
        handleCreateEntry,
    } = props;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Conciliação Bancária"
                    description="Concilie extratos bancários com lançamentos financeiros"
                >
                    <label className="btn-secondary cursor-pointer">
                        {isImporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Importar Extrato
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleImport}
                            disabled={isImporting}
                        />
                    </label>
                    <button className="btn-secondary" onClick={handleExport}>
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </PageHeader>

                {/* Bank Account Selector */}
                <div className="flex items-center gap-4">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <select
                        className="input-financial max-w-sm"
                        value={selectedBanco || ''}
                        onChange={(e) => setSelectedBanco(e.target.value)}
                    >
                        <option value="">Selecione uma conta</option>
                        {bankAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                                {' '}
                                -
                                {account.bank_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Extrato"
                            value={formatCurrency(summary.total_statements || 0)}
                            icon={FileSpreadsheet}
                        />
                        <StatCard
                            label="Conciliados"
                            value={formatCurrency(summary.reconciled_amount || 0)}
                            icon={CheckCircle2}
                            variant="income"
                        />
                        <StatCard
                            label="Pendentes"
                            value={formatCurrency(summary.pending_amount || 0)}
                            icon={AlertCircle}
                            variant="pending"
                        />
                        <StatCard
                            label="Taxa Conciliação"
                            value={`${summary.reconciliation_rate || 0}%`}
                            icon={Link2}
                            variant="primary"
                        />
                    </div>
                )}

                {/* Reconciliation Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bank Statements */}
                    <div className="card-financial">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Extrato Bancário</h3>
                            <span className="text-sm text-muted-foreground">
                                {unreconciledStatements.length}
                                {' '}
                                pendentes
                            </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {statementsLoading ? (
                                <LoadingState />
                            ) : unreconciledStatements.length === 0 ? (
                                <EmptyState icon={FileSpreadsheet} message="Nenhum registro pendente" />
                            ) : (
                                <div className="divide-y divide-border">
                                    {unreconciledStatements.map((statement) => (
                                        <div
                                            key={statement.id}
                                            className={`p-4 cursor-pointer transition-colors ${
                                                selectedExtrato === statement.id
                                                    ? 'bg-primary/10 border-l-4 border-l-primary'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => setSelectedExtrato(statement.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">
                                                        {statement.description}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(statement.date)}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className={`font-semibold font-mono ${
                                                        statement.type === 'credito' ? 'text-income' : 'text-expense'
                                                    }`}
                                                    >
                                                        {statement.type === 'debito' ? '-' : '+'}
                                                        {formatCurrency(Math.abs(statement.value))}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    className="btn-secondary text-xs py-1 px-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openCreateModal(statement);
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Criar Lançamento
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Entries */}
                    <div className="card-financial">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Lançamentos Financeiros</h3>
                            <span className="text-sm text-muted-foreground">
                                {entries.length}
                                {' '}
                                não conciliados
                            </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {entriesLoading ? (
                                <LoadingState />
                            ) : entries.length === 0 ? (
                                <EmptyState icon={FileSpreadsheet} message="Nenhum lançamento pendente" />
                            ) : (
                                <div className="divide-y divide-border">
                                    {entries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`p-4 cursor-pointer transition-colors ${
                                                selectedLancamento === entry.id
                                                    ? 'bg-primary/10 border-l-4 border-l-primary'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => setSelectedLancamento(entry.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">
                                                        {entry.description}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(entry.due_date)}
                                                        {entry.favorecido && ` • ${entry.favorecido.name}`}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className={`font-semibold font-mono ${
                                                        entry.type === 'receita' ? 'text-income' : 'text-expense'
                                                    }`}
                                                    >
                                                        {entry.type === 'despesa' ? '-' : '+'}
                                                        {formatCurrency(entry.value)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reconcile Button */}
                {selectedExtrato && selectedLancamento && (
                    <div className="flex justify-center">
                        <button
                            className="btn-primary"
                            onClick={handleReconcile}
                            disabled={isReconciling}
                        >
                            {isReconciling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Link2 className="w-4 h-4" />
                            )}
                            Conciliar Selecionados
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Match Suggestions */}
                {matchCandidates.length > 0 && (
                    <div className="card-financial p-4">
                        <h3 className="font-semibold text-foreground mb-4">Sugestões de Conciliação</h3>
                        <div className="space-y-2">
                            {matchCandidates.slice(0, 5).map((match, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {match.statement?.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(match.statement?.value || 0)}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {match.entry?.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(match.entry?.value || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {match.score}
                                            % match
                                        </span>
                                        <button
                                            className="btn-secondary p-2"
                                            onClick={() => {
                                                setSelectedExtrato(match.statement?.id);
                                                setSelectedLancamento(match.entry?.id);
                                            }}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reconciled Items */}
                {reconciledStatements.length > 0 && (
                    <div className="card-financial">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Itens Conciliados</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                            {reconciledStatements.map((statement) => (
                                <div key={statement.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-income flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-foreground">{statement.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(statement.date)}
                                                {' '}
                                                •
                                                {formatCurrency(statement.value)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-secondary p-2 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleUnreconcile(statement.reconciliation_id!)}
                                        disabled={isUnreconciling}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Entry Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) resetNewEntryForm(); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Criar Lançamento</DialogTitle>
                        <DialogDescription>
                            Crie um lançamento a partir do extrato bancário
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4 mt-4" onSubmit={handleCreateEntry}>
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
                                    {categories.filter((c) => c.type === newEntryForm.type || c.type === 'ambos').map((c) => (
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
                                {favorecidos.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={createAndReconcile}
                                onChange={(e) => setCreateAndReconcile(e.target.checked)}
                                className="w-4 h-4 rounded border-input"
                            />
                            <div>
                                <span className="text-sm font-medium text-foreground">Conciliar automaticamente</span>
                                <p className="text-xs text-muted-foreground">
                                    O lançamento será conciliado com o extrato selecionado
                                </p>
                            </div>
                        </label>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => { setIsCreateModalOpen(false); resetNewEntryForm(); }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isCreatingEntry}
                            >
                                {isCreatingEntry && <Loader2 className="w-4 h-4 animate-spin" />}
                                Criar Lançamento
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
