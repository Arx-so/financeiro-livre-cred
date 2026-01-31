import { Link } from 'react-router-dom';
import {
    Plus,
    Download,
    Upload,
    Edit,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Check,
    Ban,
    Repeat,
    TrendingUp,
    TrendingDown,
    Clock,
    FileText,
    Building2,
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    PageHeader, EmptyState, LoadingState, StatCard, SearchInput
} from '@/components/shared';
import { FavorecidoForm } from '@/pages/Favorecidos/components/FavorecidoForm';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { useFinanceiroPage } from './useFinanceiroPage';
import type { EntryType, EntryStatus, RecurrenceType } from '@/types/database';

type FinanceiroViewProps = ReturnType<typeof useFinanceiroPage>;

function getStatusBadge(status: EntryStatus) {
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
}

export function FinanceiroView(props: FinanceiroViewProps) {
    const {
        // Branch
        unidadeAtual,
        // Dialog
        dialogProps,
        isDeleting,
        // Selection
        selectedIds,
        handleSelectAll,
        handleSelect,
        // Filters
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        navigateMonth,
        currentMonthLabel,
        // Modal
        isModalOpen,
        setIsModalOpen,
        editingId,
        // Form
        formData,
        setFormData,
        resetForm,
        // Refs
        fileInputRef,
        // Data
        entries,
        entriesLoading,
        summary,
        categories,
        subcategories,
        favorecidos,
        bankAccounts,
        // Mutation states
        isSaving,
        isMarkingPaid,
        // Handlers
        handleSubmit,
        handleDelete,
        handleMarkPaid,
        handleCancel,
        openEditModal,
        handleExport,
        handleImportNFE,
        // Favorecido modal
        isFavorecidoModalOpen,
        setIsFavorecidoModalOpen,
        favorecidoFormData,
        setFavorecidoFormData,
        photoPreview,
        favorecidoFileInputRef,
        favorecidoDocumentInputRef,
        handlePhotoSelect,
        handleSubmitFavorecido,
        resetFavorecidoForm,
        isSavingFavorecido,
    } = props;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader title="Financeiro" description="Gerencie contas a pagar e receber">
                    <label className="btn-secondary cursor-pointer">
                        <Download className="w-4 h-4" />
                        Importar XML
                        <input type="file" accept=".xml" className="hidden" onChange={handleImportNFE} />
                    </label>
                    <div className="relative group">
                        <button className="btn-secondary">
                            <Upload className="w-4 h-4" />
                            Exportar
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                                onClick={() => handleExport('excel')}
                                className="block w-full px-4 py-2 text-sm text-left hover:bg-muted"
                            >
                                Excel (.xlsx)
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                className="block w-full px-4 py-2 text-sm text-left hover:bg-muted"
                            >
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
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados para
                                    {' '}
                                    {editingId ? 'atualizar o' : 'criar um novo'}
                                    {' '}
                                    lançamento financeiro.
                                </DialogDescription>
                            </DialogHeader>
                            <EntryForm
                                formData={formData}
                                setFormData={setFormData}
                                editingId={editingId}
                                categories={categories}
                                subcategories={subcategories}
                                favorecidos={favorecidos}
                                bankAccounts={bankAccounts}
                                isSaving={isSaving}
                                onSubmit={handleSubmit}
                                onCancel={() => { setIsModalOpen(false); resetForm(); }}
                                unidadeAtual={unidadeAtual}
                                onOpenFavorecidoModal={() => setIsFavorecidoModalOpen(true)}
                            />
                        </DialogContent>
                    </Dialog>
                </PageHeader>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Receitas"
                        value={formatCurrency(summary?.totalReceitas || 0)}
                        icon={TrendingUp}
                        variant="income"
                    />
                    <StatCard
                        label="Despesas"
                        value={formatCurrency(summary?.totalDespesas || 0)}
                        icon={TrendingDown}
                        variant="expense"
                    />
                    <StatCard
                        label="Pendente"
                        value={formatCurrency(summary?.pendentes || 0)}
                        icon={Clock}
                        variant="pending"
                    />
                    <StatCard
                        label="Saldo"
                        value={formatCurrency(summary?.saldo || 0)}
                        icon={TrendingUp}
                        variant={(summary?.saldo || 0) >= 0 ? 'income' : 'expense'}
                    />
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Buscar lançamentos..."
                        />
                        <select
                            className="input-financial max-w-xs"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value as 'todos' | EntryType)}
                        >
                            <option value="todos">Todos</option>
                            <option value="receita">Receitas</option>
                            <option value="despesa">Despesas</option>
                        </select>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            className="btn-secondary p-2"
                            onClick={() => navigateMonth('prev')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-foreground min-w-[140px] text-center capitalize">
                            {currentMonthLabel}
                        </span>
                        <button
                            className="btn-secondary p-2"
                            onClick={() => navigateMonth('next')}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {selectedIds.length > 0 && (
                        <button
                            className="btn-secondary text-destructive"
                            onClick={() => handleDelete(selectedIds)}
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir (
                            {selectedIds.length}
                            )
                        </button>
                    )}
                </div>

                {/* Entries Table */}
                {entriesLoading ? (
                    <LoadingState />
                ) : entries.length === 0 ? (
                    <EmptyState icon={FileText} message="Nenhum lançamento encontrado" />
                ) : (
                    <div className="card-financial overflow-hidden">
                        <table className="table-financial">
                            <thead>
                                <tr>
                                    <th className="w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === entries.length && entries.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-input"
                                        />
                                    </th>
                                    <th>Descrição</th>
                                    <th>Favorecido</th>
                                    <th>Categoria</th>
                                    <th>Vencimento</th>
                                    <th className="text-right">Valor</th>
                                    <th>Status</th>
                                    <th className="w-12" />
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
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
                                            <div className="flex items-center gap-2">
                                                {entry.type === 'receita' ? (
                                                    <ArrowUpRight className="w-4 h-4 text-income flex-shrink-0" />
                                                ) : (
                                                    <ArrowDownRight className="w-4 h-4 text-expense flex-shrink-0" />
                                                )}
                                                <Link
                                                    to={`/financeiro/${entry.id}`}
                                                    className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                                                >
                                                    {entry.description}
                                                </Link>
                                                {entry.is_recurring && (
                                                    <Repeat className="w-3.5 h-3.5 text-primary" title="Recorrente" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground">
                                            {entry.favorecido?.name || '-'}
                                        </td>
                                        <td>
                                            {entry.category && (
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                                                    style={{ backgroundColor: `${entry.category.color}20`, color: entry.category.color }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.category.color }} />
                                                    {entry.category.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground">
                                            {formatDate(entry.due_date)}
                                        </td>
                                        <td className={`text-right font-mono font-semibold ${entry.type === 'receita' ? 'text-income' : 'text-expense'}`}>
                                            {entry.type === 'despesa' && '-'}
                                            {formatCurrency(entry.value)}
                                        </td>
                                        <td>{getStatusBadge(entry.status)}</td>
                                        <td>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {entry.status === 'pendente' && (
                                                    <button
                                                        className="p-1.5 hover:bg-income/10 rounded-lg transition-colors"
                                                        onClick={() => handleMarkPaid(entry.id)}
                                                        disabled={isMarkingPaid}
                                                        title="Marcar como pago"
                                                    >
                                                        <Check className="w-4 h-4 text-income" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                                    onClick={() => openEditModal(entry)}
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                {entry.status !== 'cancelado' && (
                                                    <button
                                                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                                        onClick={() => handleCancel(entry.id)}
                                                        title="Cancelar"
                                                    >
                                                        <Ban className="w-4 h-4 text-destructive" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />

            {/* Favorecido Modal */}
            <Dialog open={isFavorecidoModalOpen} onOpenChange={(open) => { setIsFavorecidoModalOpen(open); if (!open) resetFavorecidoForm(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Favorecido</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo favorecido para usar neste lançamento.
                        </DialogDescription>
                    </DialogHeader>
                    <FavorecidoForm
                        formData={favorecidoFormData}
                        setFormData={setFavorecidoFormData}
                        editingId={null}
                        photoPreview={photoPreview}
                        fileInputRef={favorecidoFileInputRef}
                        documentInputRef={favorecidoDocumentInputRef}
                        favorecidoDocuments={[]}
                        documentsLoading={false}
                        favorecidoLogs={[]}
                        logsLoading={false}
                        isUploadingDocument={false}
                        isSaving={isSavingFavorecido}
                        onPhotoSelect={handlePhotoSelect}
                        onDocumentUpload={() => {}}
                        onDeleteDocument={() => {}}
                        onSubmit={handleSubmitFavorecido}
                        onCancel={() => { setIsFavorecidoModalOpen(false); resetFavorecidoForm(); }}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Entry Form Component
interface EntryFormProps {
    formData: any;
    setFormData: (data: any) => void;
    editingId: string | null;
    categories: any[];
    subcategories: any[];
    favorecidos: any[];
    bankAccounts: any[];
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    unidadeAtual: { id: string; name: string; code: string } | null;
    onOpenFavorecidoModal: () => void;
}

function EntryForm(props: EntryFormProps) {
    const {
        formData,
        setFormData,
        editingId,
        categories,
        subcategories,
        favorecidos,
        bankAccounts,
        isSaving,
        onSubmit,
        onCancel,
        unidadeAtual,
        onOpenFavorecidoModal,
    } = props;

    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            {/* Branch Info Banner */}
            {unidadeAtual && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                        <span className="font-medium text-foreground">Lançando na Filial: </span>
                        <span className="font-semibold text-primary">{unidadeAtual.name}</span>
                        <span className="text-muted-foreground ml-2">
                            (
                            {unidadeAtual.code}
                            )
                        </span>
                    </div>
                </div>
            )}

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
                        onChange={(numValue) => setFormData({ ...formData, value: String(numValue) })}
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
                    <div className="flex gap-2">
                        <select
                            className="input-financial flex-1"
                            value={formData.favorecido_id}
                            onChange={(e) => setFormData({ ...formData, favorecido_id: e.target.value })}
                        >
                            <option value="">Selecione</option>
                            {favorecidos.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={onOpenFavorecidoModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-primary border-2 border-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors shrink-0"
                            title="Adicionar novo favorecido"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
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
                        {categories.filter((c) => c.type === formData.type || c.type === 'ambos').map((c) => (
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
                        {subcategories.map((s) => (
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
                    {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                            {' '}
                            -
                            {' '}
                            {b.bank_name}
                        </option>
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
                        disabled={!!editingId}
                    />
                    <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Lançamento recorrente</span>
                    </div>
                </label>

                {formData.is_recurring && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Tipo de Recorrência</label>
                            <select
                                className="input-financial"
                                value={formData.recurrence_type}
                                onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as RecurrenceType | '' })}
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
                            <label className="block text-sm font-medium text-foreground mb-2">Data Final</label>
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
                    Lançamento
                </button>
            </div>
        </form>
    );
}
