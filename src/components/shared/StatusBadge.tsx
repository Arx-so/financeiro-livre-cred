import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface StatusBadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    neutral: 'badge-neutral',
    info: 'bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full',
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
    return (
        <span className={cn(variantClasses[variant], className)}>
            {children}
        </span>
    );
}

// Helper para status de lançamentos financeiros
export type EntryStatusType = 'pago' | 'pendente' | 'atrasado' | 'cancelado';

export function getEntryStatusBadge(status: EntryStatusType) {
    const config: Record<EntryStatusType, { variant: BadgeVariant; label: string }> = {
        pago: { variant: 'success', label: 'Pago' },
        pendente: { variant: 'warning', label: 'Pendente' },
        atrasado: { variant: 'danger', label: 'Atrasado' },
        cancelado: { variant: 'neutral', label: 'Cancelado' },
    };

    const { variant, label } = config[status];
    return <StatusBadge variant={variant}>{label}</StatusBadge>;
}

// Helper para status de contratos
export type ContractStatusType = 'ativo' | 'pendente' | 'encerrado';

export function getContractStatusBadge(status: ContractStatusType) {
    const config: Record<ContractStatusType, { variant: BadgeVariant; label: string }> = {
        ativo: { variant: 'success', label: 'Ativo' },
        pendente: { variant: 'warning', label: 'Pendente Assinatura' },
        encerrado: { variant: 'neutral', label: 'Encerrado' },
    };

    const { variant, label } = config[status];
    return <StatusBadge variant={variant}>{label}</StatusBadge>;
}
