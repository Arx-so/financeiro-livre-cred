import {
    Edit,
    Trash2,
    RotateCcw,
    Landmark,
    CreditCard,
    Store,
    DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BankAccountCardProps {
    account: any;
    onEdit: () => void;
    onDelete: () => void;
    onReactivate: () => void;
}

export function BankAccountCard({
    account, onEdit, onDelete, onReactivate
}: BankAccountCardProps) {
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
