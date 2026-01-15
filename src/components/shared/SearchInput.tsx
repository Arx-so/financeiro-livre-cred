import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Buscar...',
    className,
}: SearchInputProps) {
    return (
        <div className={cn('relative flex-1', className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-financial pl-11 w-full"
            />
        </div>
    );
}
