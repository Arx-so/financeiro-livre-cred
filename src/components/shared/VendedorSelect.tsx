import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useVendedores } from '@/hooks/useCadastros';
import { cn } from '@/lib/utils';

type VendedorItem = { id: string; name: string; email: string };

export interface VendedorSelectProps {
    value: string;
    onChange: (id: string, vendedor: VendedorItem | null) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

export function VendedorSelect({
    value,
    onChange,
    placeholder = 'Selecionar vendedor',
    className,
    disabled,
}: VendedorSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [internalSelected, setInternalSelected] = useState<VendedorItem | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) setTimeout(() => searchInputRef.current?.focus(), 0);
    }, [open]);

    const { data: vendedores } = useVendedores();

    const results = vendedores?.filter(
        (v) => !search
            || v.name.toLowerCase().includes(search.toLowerCase())
            || v.email.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

    const displayVendedor = internalSelected?.id === value
        ? internalSelected
        : (vendedores?.find((v) => v.id === value) ?? null);

    const handleSelect = (v: VendedorItem) => {
        setInternalSelected(v);
        onChange(v.id, v);
        setOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInternalSelected(null);
        onChange('', null);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn('input-financial flex items-center gap-2 text-left', className)}
                >
                    {displayVendedor ? (
                        <>
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className="text-xs">
                                    {getInitials(displayVendedor.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-foreground">{displayVendedor.name}</span>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="flex-1 text-muted-foreground">{placeholder}</span>
                            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                        </>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            ref={searchInputRef}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Buscar por nome ou e-mail..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
                                onClick={() => handleSelect(v)}
                            >
                                <Avatar className="w-8 h-8 shrink-0">
                                    <AvatarFallback className="text-xs bg-muted">
                                        {getInitials(v.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{v.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{v.email}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-4">
                            Nenhum vendedor encontrado.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
