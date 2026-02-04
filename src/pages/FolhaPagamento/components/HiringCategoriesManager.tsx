import { useState, useEffect } from 'react';
import {
    Plus, Trash2, Settings, X
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'hiring_categories';

interface HiringCategoriesManagerProps {
    onCategoriesChange?: (categories: string[]) => void;
}

export function HiringCategoriesManager({ onCategoriesChange }: HiringCategoriesManagerProps) {
    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Load categories from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setCategories(parsed);
                onCategoriesChange?.(parsed);
            } else {
                // Default categories
                const defaults = ['CLT', 'PJ', 'EXPERIÊNCIA', 'ESTAGIÁRIO', 'TERCEIRIZADO'];
                setCategories(defaults);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
                onCategoriesChange?.(defaults);
            }
        } catch (error) {
            console.error('Error loading hiring categories:', error);
            const defaults = ['CLT', 'PJ', 'EXPERIÊNCIA', 'ESTAGIÁRIO', 'TERCEIRIZADO'];
            setCategories(defaults);
        }
    }, [onCategoriesChange]);

    const handleAddCategory = () => {
        const trimmed = newCategory.trim().toUpperCase();
        if (!trimmed) {
            toast.error('Digite um nome para a categoria');
            return;
        }

        if (categories.includes(trimmed)) {
            toast.error('Esta categoria já existe');
            return;
        }

        const updated = [...categories, trimmed].sort();
        setCategories(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setNewCategory('');
        onCategoriesChange?.(updated);
        toast.success('Categoria adicionada!');
    };

    const handleRemoveCategory = (category: string) => {
        const updated = categories.filter((c) => c !== category);
        setCategories(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        onCategoriesChange?.(updated);
        toast.success('Categoria removida!');
    };

    return (
        <div className="relative">
            <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Settings className="w-4 h-4" />
                Configurar Categorias
            </button>

            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="absolute right-0 top-full mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">
                                Categorias de Contratação
                            </h3>
                            <button
                                type="button"
                                className="p-1 hover:bg-muted rounded-lg"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4">
                            Gerencie as categorias de contratação usadas para agrupar funcionários na criação de folhas em lote.
                        </p>

                        {/* Add new category */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                className="input-financial flex-1"
                                placeholder="Ex: CLT, PJ, EXPERIÊNCIA..."
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCategory();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleAddCategory}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Categories list */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma categoria cadastrada
                                </p>
                            ) : (
                                categories.map((category) => (
                                    <div
                                        key={category}
                                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50"
                                    >
                                        <span className="text-sm font-medium text-foreground">
                                            {category}
                                        </span>
                                        <button
                                            type="button"
                                            className="p-1 hover:bg-destructive/10 rounded-lg text-destructive"
                                            onClick={() => handleRemoveCategory(category)}
                                            title="Remover categoria"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Hook to get categories
export function useHiringCategoriesFromStorage(): string[] {
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setCategories(JSON.parse(stored));
            } else {
                const defaults = ['CLT', 'PJ', 'EXPERIÊNCIA', 'ESTAGIÁRIO', 'TERCEIRIZADO'];
                setCategories(defaults);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
            }
        } catch (error) {
            console.error('Error loading hiring categories:', error);
            setCategories(['CLT', 'PJ', 'EXPERIÊNCIA', 'ESTAGIÁRIO', 'TERCEIRIZADO']);
        }
    }, []);

    return categories;
}
