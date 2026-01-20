import { Package, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProductWithCategory } from '@/services/products';

interface ProductCardProps {
    product: ProductWithCategory;
    onEdit: (product: ProductWithCategory) => void;
    onDelete: (id: string, name: string) => void;
    onToggleActive?: (id: string, isActive: boolean) => void;
}

export function ProductCard({ product, onEdit, onDelete, onToggleActive }: ProductCardProps) {
    return (
        <div className="card-financial p-5 group">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            {!product.is_active && (
                                <span className="badge-neutral text-xs">Inativo</span>
                            )}
                        </div>
                        {product.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                            </p>
                        )}
                        {product.category && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs mt-2"
                                style={{
                                    backgroundColor: `${product.category.color}20`,
                                    color: product.category.color,
                                }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: product.category.color }}
                                />
                                {product.category.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor Banco</p>
                    <p className="font-semibold font-mono text-foreground">
                        {formatCurrency(product.bank_value)}
                        {product.bank_percentage > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                                ({product.bank_percentage}%)
                            </span>
                        )}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor Empresa</p>
                    <p className="font-semibold font-mono text-foreground">
                        {formatCurrency(product.company_value)}
                        {product.company_percentage > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                                ({product.company_percentage}%)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button
                    className="btn-secondary py-2 flex-1"
                    onClick={() => onEdit(product)}
                >
                    <Edit className="w-4 h-4" />
                    Editar
                </button>
                {onToggleActive && (
                    <button
                        className="btn-secondary py-2"
                        onClick={() => onToggleActive(product.id, !product.is_active)}
                        title={product.is_active ? 'Desativar' : 'Ativar'}
                    >
                        {product.is_active ? (
                            <ToggleRight className="w-4 h-4 text-income" />
                        ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>
                )}
                <button
                    className="btn-secondary py-2 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(product.id, product.name)}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
