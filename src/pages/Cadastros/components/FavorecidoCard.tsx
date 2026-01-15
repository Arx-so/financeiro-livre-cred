import {
    Edit,
    Trash2,
    Mail,
    Phone,
    MapPin,
    MoreHorizontal,
    User,
    Building2,
    Users,
} from 'lucide-react';
import type { FavorecidoTipo } from '@/types/database';

interface FavorecidoCardProps {
    favorecido: {
        id: string;
        name: string;
        type: FavorecidoTipo;
        email?: string | null;
        phone?: string | null;
        city?: string | null;
        state?: string | null;
        photo_url?: string | null;
    };
    onEdit: () => void;
    onDelete: () => void;
}

function getTypeIcon(type: FavorecidoTipo) {
    switch (type) {
        case 'fornecedor':
            return <Building2 className="w-6 h-6 text-primary" />;
        case 'funcionario':
            return <Users className="w-6 h-6 text-primary" />;
        default:
            return <User className="w-6 h-6 text-primary" />;
    }
}

function getTypeBadge(type: FavorecidoTipo) {
    switch (type) {
        case 'cliente':
            return <span className="text-xs px-2 py-0.5 rounded-full bg-income-muted text-income">Cliente</span>;
        case 'fornecedor':
            return <span className="text-xs px-2 py-0.5 rounded-full bg-expense-muted text-expense">Fornecedor</span>;
        case 'funcionario':
            return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Funcionário</span>;
        case 'ambos':
            return <span className="text-xs px-2 py-0.5 rounded-full bg-pending-muted text-pending">Cliente/Fornecedor</span>;
        default:
            return null;
    }
}

export function FavorecidoCard({ favorecido, onEdit, onDelete }: FavorecidoCardProps) {
    return (
        <div className="card-financial p-5 group">
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
                        <span>
                            {favorecido.city}
                            {favorecido.state ? ` - ${favorecido.state}` : ''}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button
                    className="btn-secondary flex-1 py-2"
                    onClick={onEdit}
                >
                    <Edit className="w-4 h-4" />
                    Editar
                </button>
                <button
                    className="btn-secondary py-2 px-3 text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
