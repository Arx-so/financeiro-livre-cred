import { DollarSign, Package, Edit, Check, X, Loader2, Building2, ChevronsUpDown, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    PageHeader,
    EmptyState,
    LoadingState,
    SearchInput,
} from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBranchStore } from '@/stores';
import { useBranches } from '@/hooks/useBranches';
import type { useTabelasPrecosPage } from './useTabelasPrecosPage';

type TabelasPrecosViewProps = ReturnType<typeof useTabelasPrecosPage>;

export function TabelasPrecosView(props: TabelasPrecosViewProps) {
    const {
        // Branch
        unidadeAtual,

        // State
        searchTerm,
        setSearchTerm,
        editingProductId,
        editingPrice,
        setEditingPrice,

        // Data
        products,
        productsLoading,

        // Flags
        isSaving,

        // Handlers
        startEditing,
        cancelEditing,
        savePrice,
        handlePriceKeyDown,
    } = props;

    const { unidades, setUnidadeAtual } = useBranchStore();
    const { data: allBranches } = useBranches({ isActive: true });

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Tabelas de Preços"
                    description="Defina os preços de venda dos produtos por filial"
                />

                {/* Branch Selector */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-primary" />
                                <div>
                                    <span className="font-medium text-foreground">
                                        Filial:
                                        {' '}
                                        {unidadeAtual?.name || 'Selecione uma filial'}
                                    </span>
                                    {unidadeAtual && (
                                        <span className="text-sm text-muted-foreground ml-2">
                                            (
                                            {unidadeAtual.code}
                                            )
                                        </span>
                                    )}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="btn-secondary flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Trocar Filial
                                        <ChevronsUpDown className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {(allBranches || unidades).map((branch) => (
                                        <DropdownMenuItem
                                            key={branch.id}
                                            onClick={() => setUnidadeAtual(branch)}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Building2 className="w-4 h-4" />
                                            <div className="flex-1">
                                                <span className="font-medium">{branch.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {branch.code}
                                                </span>
                                            </div>
                                            {unidadeAtual?.id === branch.id && (
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Os preços definidos aqui são específicos para esta filial.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar produtos..."
                        className="max-w-md"
                    />
                </div>

                {/* Products Table */}
                {productsLoading ? (
                    <LoadingState />
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        message="Nenhum produto encontrado"
                    />
                ) : (
                    <div className="card-financial overflow-hidden">
                        <table className="table-financial">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Descrição</th>
                                    <th className="text-right">Preço de Venda</th>
                                    <th className="w-24" />
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="group">
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium text-foreground">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground">
                                            {product.description || '-'}
                                        </td>
                                        <td className="text-right">
                                            {editingProductId === product.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <CurrencyInput
                                                        value={editingPrice && !isNaN(parseFloat(editingPrice)) ? parseFloat(editingPrice) : 0}
                                                        onChange={(value) => {
                                                            setEditingPrice(String(value || 0));
                                                        }}
                                                        onKeyDown={(e) => handlePriceKeyDown(e, product.id)}
                                                        autoFocus
                                                        className="w-32"
                                                    />
                                                </div>
                                            ) : (
                                                <span className={`font-mono font-semibold ${product.sale_price ? 'text-income' : 'text-muted-foreground'}`}>
                                                    {product.sale_price
                                                        ? formatCurrency(product.sale_price)
                                                        : 'Não definido'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1">
                                                {editingProductId === product.id ? (
                                                    <>
                                                        <button
                                                            className="p-1.5 hover:bg-income/10 rounded-lg transition-colors"
                                                            onClick={() => savePrice(product.id)}
                                                            disabled={isSaving}
                                                            title="Salvar"
                                                        >
                                                            {isSaving ? (
                                                                <Loader2 className="w-4 h-4 text-income animate-spin" />
                                                            ) : (
                                                                <Check className="w-4 h-4 text-income" />
                                                            )}
                                                        </button>
                                                        <button
                                                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                                            onClick={cancelEditing}
                                                            title="Cancelar"
                                                        >
                                                            <X className="w-4 h-4 text-destructive" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={() => startEditing(product.id, product.sale_price)}
                                                        title="Editar preço"
                                                    >
                                                        <Edit className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
