import {
    Loader2, Store, Eye, EyeOff
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '@/types/database';
import { RolePermissionsPanel } from '@/components/shared/RolePermissionsPanel';

interface UserFormProps {
    form: any;
    setForm: (form: any) => void;
    branches: any[];
    isSaving: boolean;
    isCreating: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    toggleBranchSelection: (branchId: string) => void;
}

const roleDescriptions: Partial<Record<UserRole, string>> = {
    admin: 'Acesso total ao sistema, todas as filiais.',
    gerente: 'Gerencia lançamentos, cadastros e relatórios em todas as filiais permitidas.',
    coordenador: 'Acesso operacional completo na filial: lançamentos, contratos e relatórios.',
    assistente: 'Cria e visualiza lançamentos e contratos na filial. Sem exclusão.',
    vendedor: 'Acesso ao módulo de vendas: contratos, produtos e metas.',
    seguranca: 'Acesso restrito: dashboard, favorecidos (somente leitura) e agenda.',
    financeiro: 'Acesso completo ao módulo financeiro: lançamentos, relatórios e fluxo de caixa.',
    rh: 'Acesso ao módulo de RH: funcionários, férias, atestados e vale transporte.',
    leitura: 'Somente visualização. Não pode criar ou editar registros.',
};

export function UserForm({
    form, setForm, branches, isSaving, isCreating, onSubmit, onCancel, toggleBranchSelection
}: UserFormProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Nome
                    {' '}
                    <span className="text-expense">*</span>
                </label>
                <input
                    type="text"
                    className="input-financial"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                />
            </div>

            {isCreating && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Email
                            {' '}
                            <span className="text-expense">*</span>
                        </label>
                        <input
                            type="email"
                            className="input-financial"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="email@exemplo.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Senha
                            {' '}
                            <span className="text-expense">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-financial pr-10"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            O usuário poderá alterar a senha após o primeiro login.
                        </p>
                    </div>
                </>
            )}

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Função</label>
                <select
                    className="input-financial"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                    <option value="admin">Administrador</option>
                    <option value="gerente">Gerente</option>
                    <option value="coordenador">Coordenador</option>
                    <option value="assistente">Assistente</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="seguranca">Segurança</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="rh">Recursos Humanos</option>
                    <option value="leitura">Leitura</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                    {roleDescriptions[form.role as UserRole] || ''}
                </p>
            </div>

            {/* Permissions Panel */}
            <RolePermissionsPanel role={form.role as UserRole} />

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
                    {isCreating ? 'Criar Usuário' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
}
