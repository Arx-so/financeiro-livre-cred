import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    message: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon: Icon,
    message,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{message}</p>
            {description && (
                <p className="text-sm mt-1">{description}</p>
            )}
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
}
