import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getProducts, getProduct } from '@/services/products';
import type { ProductWithCategory } from '@/services/products';
import { cn } from '@/lib/utils';

export interface ProductSelectProps {
    value: string;
    onChange: (id: string, product: ProductWithCategory | null) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function ProductSelect({
    value,
    onChange,
    placeholder = 'Selecionar produto',
    className,
    disabled,
}: ProductSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [internalSelected, setInternalSelected] = useState<ProductWithCategory | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) setTimeout(() => searchInputRef.current?.focus(), 0);
    }, [open]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const searchFilters = { search: debouncedSearch || undefined, isActive: true as const };

    const { data: results, isLoading } = useQuery({
        queryKey: ['products', searchFilters],
        queryFn: () => getProducts(searchFilters),
        enabled: open,
    });

    const { data: resolvedProduct } = useQuery({
        queryKey: ['products', value],
        queryFn: () => getProduct(value),
        enabled: !!value && internalSelected?.id !== value,
        staleTime: 5 * 60 * 1000,
    });

    const displayProduct = resolvedProduct ?? internalSelected;

    const handleSelect = (p: ProductWithCategory) => {
        setInternalSelected(p);
        onChange(p.id, p);
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
                    {displayProduct ? (
                        <>
                            <span className="flex-1 truncate text-foreground">
                                {displayProduct.name}
                                {displayProduct.code && (
                                    <span className="text-muted-foreground ml-1">
                                        (
                                        {displayProduct.code}
                                        )
                                    </span>
                                )}
                            </span>
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
                            placeholder="Buscar produto..."
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
                        results.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
                                onClick={() => handleSelect(p)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {[p.code, p.product_category?.name].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-4">
                            Nenhum produto encontrado.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
