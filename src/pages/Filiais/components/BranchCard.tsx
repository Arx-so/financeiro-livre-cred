import {
    Edit,
    Trash2,
    RotateCcw,
    Store,
    Phone,
    MapPin,
} from 'lucide-react';

interface BranchCardProps {
    branch: any;
    onEdit: () => void;
    onDelete: () => void;
    onReactivate: () => void;
}

export function BranchCard({
    branch, onEdit, onDelete, onReactivate
}: BranchCardProps) {
    return (
        <div className={`card-financial p-5 group ${!branch.is_active ? 'opacity-60' : ''}`}>
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
                <button className="btn-secondary flex-1 py-2" onClick={onEdit}>
                    <Edit className="w-4 h-4" />
                    Editar
                </button>
                {branch.is_active ? (
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
                        title="Reativar filial"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
