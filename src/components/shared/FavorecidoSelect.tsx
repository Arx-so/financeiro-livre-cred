import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cadastrosKeys } from '@/hooks/useCadastros';
import { getFavorecidos } from '@/services/cadastros';
import { supabase } from '@/lib/supabase';
import { useBranchStore } from '@/stores';
import type { Favorecido, FavorecidoTipo } from '@/types/database';
import { cn } from '@/lib/utils';

export interface FavorecidoSelectProps {
    value: string;
    onChange: (id: string, favorecido: Favorecido | null) => void;
    placeholder?: string;
    filterType?: FavorecidoTipo;
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

export function FavorecidoSelect({
    value,
    onChange,
    placeholder = 'Selecionar favorecido',
    filterType,
    className,
    disabled,
}: FavorecidoSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [internalSelected, setInternalSelected] = useState<Favorecido | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    useEffect(() => {
        if (open) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [open]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const searchFilters = {
        branchId,
        search: debouncedSearch || undefined,
        isActive: true as const,
        type: filterType,
    };

    const { data: resultsPage, isLoading } = useQuery({
        queryKey: cadastrosKeys.list(searchFilters),
        queryFn: () => getFavorecidos(searchFilters),
        enabled: open,
    });
    const results = resultsPage?.data;

    const { data: resolvedFavorecido } = useQuery({
        queryKey: ['favorecidos', 'detail', value],
        queryFn: async () => {
            const { data } = await supabase.from('favorecidos').select('*').eq('id', value).single();
            return data as Favorecido;
        },
        enabled: !!value && internalSelected?.id !== value,
        staleTime: 5 * 60 * 1000,
    });

    const displayFavorecido = resolvedFavorecido ?? internalSelected;

    const handleSelect = (fav: Favorecido) => {
        setInternalSelected(fav);
        onChange(fav.id, fav);
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
                    {displayFavorecido ? (
                        <>
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={displayFavorecido.photo_url ?? undefined} />
                                <AvatarFallback className="text-xs">
                                    {getInitials(displayFavorecido.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-foreground">{displayFavorecido.name}</span>
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
                            placeholder="Buscar por nome, CPF..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : results && results.length > 0 ? (
                        results.map((fav) => (
                            <button
                                key={fav.id}
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
                                onClick={() => handleSelect(fav)}
                            >
                                <Avatar className="w-8 h-8 shrink-0">
                                    <AvatarImage src={fav.photo_url ?? undefined} />
                                    <AvatarFallback className="text-xs bg-muted">
                                        {getInitials(fav.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{fav.name}</p>
                                    {fav.document && (
                                        <p className="text-xs text-muted-foreground truncate">{fav.document}</p>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-4">
                            Nenhum favorecido encontrado.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
