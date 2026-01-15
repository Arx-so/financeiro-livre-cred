import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';
import { CepInput } from '@/components/ui/cep-input';

interface BranchFormProps {
    form: any;
    setForm: (form: any) => void;
    isEditing: boolean;
    isSaving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function BranchForm({
    form, setForm, isEditing, isSaving, onSubmit, onCancel
}: BranchFormProps) {
    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nome da Filial *</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: Matriz, Filial Centro"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Código *</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: MTZ, FLC01"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                <PhoneInput
                    value={form.phone}
                    onChange={(value) => setForm({ ...form, phone: value })}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                    <CepInput
                        value={form.zip_code}
                        onChange={(value) => setForm({ ...form, zip_code: value })}
                        onAddressFound={(address) => {
                            setForm((prev: any) => ({
                                ...prev,
                                address: address.logradouro ? `${address.logradouro}${address.bairro ? `, ${address.bairro}` : ''}` : prev.address,
                                city: address.localidade || prev.city,
                                state: address.uf || prev.state,
                            }));
                            toast.success('Endereço encontrado!');
                        }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cidade</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Cidade"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="UF"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Rua, número, bairro"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                    Filial
                </button>
            </div>
        </form>
    );
}
