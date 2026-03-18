import { useState } from 'react';
import { Repeat, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { FinancialEntry } from '@/types/database';

export type RecurringEditScope = 'single' | 'following' | 'previous' | 'all';

interface RecurringEditDialogProps {
    open: boolean;
    entry: FinancialEntry | null;
    groupEntries: FinancialEntry[];
    onConfirm: (scope: RecurringEditScope, newCount?: number) => void;
    onCancel: () => void;
}

export function RecurringEditDialog({
    open, entry, groupEntries, onConfirm, onCancel,
}: RecurringEditDialogProps) {
    const [scope, setScope] = useState<RecurringEditScope>('single');
    const [reduceCount, setReduceCount] = useState(false);
    const [newCount, setNewCount] = useState('');

    if (!entry) return null;

    const currentIndex = groupEntries.findIndex((e) => e.id === entry.id);
    const followingCount = groupEntries.length - currentIndex;
    const previousCount = currentIndex + 1;
    const totalCount = groupEntries.length;

    const showReduceOption = scope === 'following' || scope === 'all';
    const maxReduceCount = scope === 'all'
        ? groupEntries.slice(currentIndex).length
        : followingCount;

    const parsedNewCount = newCount ? parseInt(newCount, 10) : undefined;
    const willDelete = reduceCount && parsedNewCount !== undefined && parsedNewCount < maxReduceCount;
    const deleteCount = willDelete ? maxReduceCount - parsedNewCount! : 0;

    const handleConfirm = () => {
        const countToKeep = reduceCount && parsedNewCount ? parsedNewCount : undefined;
        onConfirm(scope, countToKeep);
        // reset local state
        setScope('single');
        setReduceCount(false);
        setNewCount('');
    };

    const handleCancel = () => {
        setScope('single');
        setReduceCount(false);
        setNewCount('');
        onCancel();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => { if (!open) handleCancel(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-primary" />
                        Editar Lançamento Recorrente
                    </DialogTitle>
                    <DialogDescription>
                        Este lançamento faz parte de uma série com
                        {' '}
                        <strong>{totalCount}</strong>
                        {' '}
                        parcela(s) no total. Como deseja aplicar as alterações?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 mt-1">
                    <ScopeOption
                        selected={scope === 'single'}
                        onClick={() => { setScope('single'); setReduceCount(false); setNewCount(''); }}
                        title="Apenas este lançamento"
                        description="Somente este lançamento será alterado. Os demais não serão afetados."
                        badge="1 parcela"
                    />
                    <ScopeOption
                        selected={scope === 'following'}
                        onClick={() => setScope('following')}
                        title="Este e os seguintes"
                        description="Este lançamento e todos os posteriores na série serão atualizados."
                        badge={`${followingCount} parcela(s)`}
                    />
                    <ScopeOption
                        selected={scope === 'previous'}
                        onClick={() => { setScope('previous'); setReduceCount(false); setNewCount(''); }}
                        title="Este e os anteriores"
                        description="Este lançamento e todos os anteriores na série serão atualizados."
                        badge={`${previousCount} parcela(s)`}
                    />
                    <ScopeOption
                        selected={scope === 'all'}
                        onClick={() => setScope('all')}
                        title="Todos os lançamentos"
                        description="Todos os lançamentos da série serão atualizados."
                        badge={`${totalCount} parcela(s)`}
                    />
                </div>

                {showReduceOption && (
                    <div className="border-t border-border pt-4 mt-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={reduceCount}
                                onChange={(e) => {
                                    setReduceCount(e.target.checked);
                                    if (!e.target.checked) setNewCount('');
                                }}
                                className="w-4 h-4 rounded border-input mt-0.5"
                            />
                            <div>
                                <span className="text-sm font-medium text-foreground">
                                    Reduzir parcelas futuras
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Remove os lançamentos futuros além da quantidade escolhida.
                                    Há
                                    {' '}
                                    <strong>{maxReduceCount}</strong>
                                    {' '}
                                    parcela(s) a partir deste lançamento (incluindo este).
                                </p>
                            </div>
                        </label>

                        {reduceCount && (
                            <div className="mt-3 ml-7 space-y-2">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-foreground whitespace-nowrap">
                                        Manter apenas
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={maxReduceCount}
                                        className="input-financial w-24"
                                        placeholder={String(maxReduceCount)}
                                        value={newCount}
                                        onChange={(e) => setNewCount(e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        de
                                        {' '}
                                        {maxReduceCount}
                                        {' '}
                                        parcela(s) a partir deste
                                    </span>
                                </div>
                                {willDelete && (
                                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 rounded-lg border border-destructive/20">
                                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                                        <span className="text-xs text-destructive">
                                            <strong>{deleteCount}</strong>
                                            {' '}
                                            lançamento(s) futuro(s) serão excluídos permanentemente.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" className="btn-secondary" onClick={handleCancel}>
                        Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={handleConfirm}>
                        Continuar para edição
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface ScopeOptionProps {
    selected: boolean;
    onClick: () => void;
    title: string;
    description: string;
    badge: string;
}

function ScopeOption({
    selected, onClick, title, description, badge,
}: ScopeOptionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left p-3.5 rounded-lg border-2 transition-colors ${
                selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                            selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}
                    >
                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                <span
                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                        selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                >
                    {badge}
                </span>
            </div>
        </button>
    );
}
