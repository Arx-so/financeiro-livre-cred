import { Loader2 } from 'lucide-react';
import type { RecurrenceType } from '@/types/database';

interface CategoryFormProps {
    form: any;
    setForm: (form: any) => void;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function CategoryForm({
    form, setForm, isSaving, onSubmit, onCancel
}: CategoryFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Nome da categoria"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                    <select
                        className="input-financial"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                        <option value="ambos">Ambos</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
                    <input
                        type="color"
                        className="input-financial h-10"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subcategorias</label>
                <textarea
                    className="input-financial min-h-[80px]"
                    placeholder="Digite as subcategorias separadas por vírgula"
                    value={form.subcategories}
                    onChange={(e) => setForm({ ...form, subcategories: e.target.value })}
                />
            </div>

            <div className="border-t border-border pt-4 mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_recurring}
                        onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                        className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm font-medium text-foreground">Categoria recorrente</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                    Lançamentos desta categoria terão recorrência por padrão
                </p>

                {form.is_recurring && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Tipo de Recorrência</label>
                            <select
                                className="input-financial"
                                value={form.default_recurrence_type}
                                onChange={(e) => setForm({ ...form, default_recurrence_type: e.target.value as RecurrenceType | '' })}
                            >
                                <option value="">Selecione...</option>
                                <option value="diario">Diário</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensal">Mensal</option>
                                <option value="anual">Anual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                {form.default_recurrence_type === 'semanal' ? 'Dia da Semana' : 'Dia do Mês'}
                            </label>
                            {form.default_recurrence_type === 'semanal' ? (
                                <select
                                    className="input-financial"
                                    value={form.default_recurrence_day}
                                    onChange={(e) => setForm({ ...form, default_recurrence_day: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="0">Domingo</option>
                                    <option value="1">Segunda-feira</option>
                                    <option value="2">Terça-feira</option>
                                    <option value="3">Quarta-feira</option>
                                    <option value="4">Quinta-feira</option>
                                    <option value="5">Sexta-feira</option>
                                    <option value="6">Sábado</option>
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="input-financial"
                                    placeholder="1-31"
                                    value={form.default_recurrence_day}
                                    onChange={(e) => setForm({ ...form, default_recurrence_day: e.target.value })}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Categoria
                </button>
            </div>
        </form>
    );
}
