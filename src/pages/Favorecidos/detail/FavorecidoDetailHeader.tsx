import {
    ArrowLeft,
    Edit,
    User,
    Building2,
    Users,
    TrendingUp,
    TrendingDown,
    Clock,
    FileText,
    ShoppingCart,
    Banknote,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import type { Favorecido } from '@/types/database';

interface Kpis {
    totalReceita: number;
    totalDespesa: number;
    totalPendente: number;
    contratosAtivos: number;
    totalVendasCC: number;
    totalVendasDP: number;
    ultimoSalario: number | null;
}

interface FavorecidoDetailHeaderProps {
    favorecido: Favorecido;
    kpis: Kpis;
    onEdit: () => void;
}

function TypeIcon({ type }: { type: Favorecido['type'] }) {
    switch (type) {
        case 'fornecedor': return <Building2 className="w-8 h-8 text-primary" />;
        case 'funcionario': return <Users className="w-8 h-8 text-primary" />;
        default: return <User className="w-8 h-8 text-primary" />;
    }
}

function TypeBadge({ type }: { type: Favorecido['type'] }) {
    const map: Record<Favorecido['type'], { label: string; className: string }> = {
        cliente: { label: 'Cliente', className: 'text-xs px-2 py-0.5 rounded-full bg-income-muted text-income' },
        fornecedor: { label: 'Fornecedor', className: 'text-xs px-2 py-0.5 rounded-full bg-expense-muted text-expense' },
        funcionario: { label: 'Funcionário', className: 'text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary' },
        ambos: { label: 'Cliente/Fornecedor', className: 'text-xs px-2 py-0.5 rounded-full bg-pending-muted text-pending' },
    };
    const cfg = map[type];
    return <span className={cfg.className}>{cfg.label}</span>;
}

function KpiGrid({ favorecido, kpis }: { favorecido: Favorecido; kpis: Kpis }) {
    const { type } = favorecido;
    const isEmployee = type === 'funcionario' || type === 'ambos';
    const isClient = type === 'cliente' || type === 'ambos';
    const isSupplier = type === 'fornecedor' || type === 'ambos';

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {isClient && (
                <StatCard
                    label="Total Recebido"
                    value={formatCurrency(kpis.totalReceita)}
                    icon={TrendingUp}
                    variant="income"
                />
            )}
            {isSupplier && (
                <StatCard
                    label="Total Pago"
                    value={formatCurrency(kpis.totalDespesa)}
                    icon={TrendingDown}
                    variant="expense"
                />
            )}
            {!isClient && !isSupplier && (
                <>
                    <StatCard
                        label="Total Recebido"
                        value={formatCurrency(kpis.totalReceita)}
                        icon={TrendingUp}
                        variant="income"
                    />
                    <StatCard
                        label="Total Pago"
                        value={formatCurrency(kpis.totalDespesa)}
                        icon={TrendingDown}
                        variant="expense"
                    />
                </>
            )}
            <StatCard
                label="Pendente"
                value={formatCurrency(kpis.totalPendente)}
                icon={Clock}
                variant="pending"
            />
            {(isClient || isSupplier) && (
                <StatCard
                    label="Contratos Ativos"
                    value={kpis.contratosAtivos}
                    icon={FileText}
                    variant="primary"
                />
            )}
            {(isClient || isEmployee) && kpis.totalVendasCC > 0 && (
                <StatCard
                    label="Vendas Maquininha"
                    value={formatCurrency(kpis.totalVendasCC)}
                    icon={ShoppingCart}
                    variant="primary"
                />
            )}
            {isEmployee && kpis.ultimoSalario !== null && (
                <StatCard
                    label="Último Salário"
                    value={formatCurrency(kpis.ultimoSalario)}
                    icon={Banknote}
                    variant="default"
                />
            )}
        </div>
    );
}

export function FavorecidoDetailHeader({ favorecido, kpis, onEdit }: FavorecidoDetailHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <button
                className="btn-ghost flex items-center gap-2 text-muted-foreground -ml-1"
                onClick={() => navigate('/favorecidos')}
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar
            </button>

            <div className="card-financial p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {favorecido.photo_url ? (
                            <img
                                src={favorecido.photo_url}
                                alt={favorecido.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                <TypeIcon type={favorecido.type} />
                            </div>
                        )}
                        <div className="space-y-1">
                            <h1 className="text-xl font-bold text-foreground">{favorecido.name}</h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <TypeBadge type={favorecido.type} />
                                {favorecido.category && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        {favorecido.category}
                                    </span>
                                )}
                                {!favorecido.is_active && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                        Inativo
                                    </span>
                                )}
                            </div>
                            {(favorecido.email || favorecido.phone) && (
                                <p className="text-sm text-muted-foreground">
                                    {[favorecido.phone, favorecido.email].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="btn-secondary shrink-0" onClick={onEdit}>
                        <Edit className="w-4 h-4" />
                        Editar
                    </button>
                </div>

                <KpiGrid favorecido={favorecido} kpis={kpis} />
            </div>
        </div>
    );
}
