import { Loader2 } from 'lucide-react';

interface BankAccountFormProps {
    form: any;
    setForm: (form: any) => void;
    branches: any[];
    isEditing: boolean;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function BankAccountForm({
    form, setForm, branches, isEditing, isSaving, onSubmit, onCancel
}: BankAccountFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome da Conta *</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Ex: Conta Principal, Caixa Empresa"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Banco *</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Ex: Banco do Brasil, Itaú, Bradesco"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Agência</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="0000"
                        value={form.agency}
                        onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Número da Conta</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="00000-0"
                        value={form.account_number}
                        onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Filial *</label>
                <select
                    className="input-financial"
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    required
                >
                    <option value="">Selecione uma filial</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                            {' '}
                            (
                            {branch.code}
                            )
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Saldo Inicial</label>
                <input
                    type="number"
                    step="0.01"
                    className="input-financial"
                    placeholder="0,00"
                    value={form.initial_balance}
                    onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Atualizar' : 'Salvar'}
                    {' '}
                    Conta
                </button>
            </div>
        </form>
    );
}
