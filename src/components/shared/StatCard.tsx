import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardVariant = 'default' | 'income' | 'expense' | 'pending' | 'primary';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    variant?: StatCardVariant;
    trend?: React.ReactNode;
    className?: string;
}

const variantClasses: Record<StatCardVariant, string> = {
    default: 'stat-card',
    income: 'stat-card stat-card-income',
    expense: 'stat-card stat-card-expense',
    pending: 'stat-card stat-card-pending',
    primary: 'stat-card stat-card-primary',
};

const iconBgClasses: Record<StatCardVariant, string> = {
    default: 'bg-muted',
    income: 'bg-income-muted',
    expense: 'bg-expense-muted',
    pending: 'bg-pending-muted',
    primary: 'bg-primary/10',
};

const iconColorClasses: Record<StatCardVariant, string> = {
    default: 'text-muted-foreground',
    income: 'text-income',
    expense: 'text-expense',
    pending: 'text-pending',
    primary: 'text-primary',
};

export function StatCard({
    label,
    value,
    icon: Icon,
    variant = 'default',
    trend,
    className,
}: StatCardProps) {
    return (
        <div className={cn(variantClasses[variant], className)}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold font-mono-numbers text-foreground mt-1">
                        {value}
                    </p>
                </div>
                {Icon && (
                    <div className={cn('p-2 rounded-lg', iconBgClasses[variant])}>
                        <Icon className={cn('w-5 h-5', iconColorClasses[variant])} />
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-3">
                    {trend}
                </div>
            )}
        </div>
    );
}
