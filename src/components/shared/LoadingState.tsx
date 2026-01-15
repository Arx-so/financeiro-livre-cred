import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
    message?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
};

export function LoadingState({ message, className, size = 'md' }: LoadingStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12', className)}>
            <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
            {message && (
                <p className="text-sm text-muted-foreground mt-3">{message}</p>
            )}
        </div>
    );
}
