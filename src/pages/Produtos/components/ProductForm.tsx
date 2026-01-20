import { Loader2 } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { Category } from '@/types/database';

interface FormData {
    name: string;
    description: string;
    category_id: string;
    bank_value: string;
    bank_percentage: string;
    company_value: string;
    company_percentage: string;
    is_active: boolean;
}

interface ProductFormProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
    categories: Category[];
    editingId: string | null;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function ProductForm({
    formData,
    setFormData,
    categories,
    editingId,
    isSaving,
    onSubmit,
    onCancel,
}: ProductFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Nome *
                </label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Nome do produto"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Descrição
                </label>
                <textarea
                    className="input-financial min-h-[80px]"
                    placeholder="Descrição do produto"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Categoria
                </label>
                <select
                    className="input-financial"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Valores do Banco</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Valor (R$)
                        </label>
                        <CurrencyInput
                            value={formData.bank_value}
                            onChange={(numValue) => setFormData({ ...formData, bank_value: String(numValue) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Percentual (%)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="input-financial"
                            placeholder="0.00"
                            value={formData.bank_percentage}
                            onChange={(e) => setFormData({ ...formData, bank_percentage: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Valores da Empresa</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Valor (R$)
                        </label>
                        <CurrencyInput
                            value={formData.company_value}
                            onChange={(numValue) => setFormData({ ...formData, company_value: String(numValue) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Percentual (%)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="input-financial"
                            placeholder="0.00"
                            value={formData.company_percentage}
                            onChange={(e) => setFormData({ ...formData, company_percentage: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-border pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm font-medium text-foreground">
                        Produto ativo
                    </span>
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? 'Atualizar' : 'Criar'} Produto
                </button>
            </div>
        </form>
    );
}
