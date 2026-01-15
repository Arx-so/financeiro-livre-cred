import { Loader2, Store } from 'lucide-react';
import type { UserRole } from '@/types/database';

interface UserFormProps {
    form: any;
    setForm: (form: any) => void;
    branches: any[];
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    toggleBranchSelection: (branchId: string) => void;
}

export function UserForm({
    form, setForm, branches, isSaving, onSubmit, onCancel, toggleBranchSelection
}: UserFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Função</label>
                <select
                    className="input-financial"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                    <option value="usuario">Usuário</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                    {form.role === 'admin' && 'Administradores têm acesso total ao sistema.'}
                    {form.role === 'gerente' && 'Gerentes podem gerenciar lançamentos e cadastros nas filiais permitidas.'}
                    {form.role === 'usuario' && 'Usuários podem visualizar e criar lançamentos nas filiais permitidas.'}
                </p>
            </div>

            {form.role !== 'admin' && (
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Filiais Permitidas</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                        {branches.map((branch) => (
                            <label
                                key={branch.id}
                                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.selectedBranches.includes(branch.id)}
                                    onChange={() => toggleBranchSelection(branch.id)}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{branch.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        (
                                        {branch.code}
                                        )
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Selecione as filiais que este usuário pode acessar.
                    </p>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                </button>
            </div>
        </form>
    );
}
