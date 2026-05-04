import {
    Mail, Phone, MapPin, FileText, CreditCard, Calendar, Landmark
} from 'lucide-react';
import type { Favorecido } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface TabCadastroProps {
    favorecido: Favorecido;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-medium text-foreground">{value || '—'}</p>
        </div>
    );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="card-financial p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
                <Icon className="w-4 h-4 text-primary" />
                {title}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

const pixKeyTypeLabel: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    telefone: 'Telefone',
    aleatoria: 'Chave Aleatória',
};

const paymentTypeLabel: Record<string, string> = {
    pix: 'PIX',
    ted: 'TED',
    boleto: 'Boleto',
    cartao: 'Cartão',
    dinheiro: 'Dinheiro',
};

export function TabCadastro({ favorecido }: TabCadastroProps) {
    return (
        <div className="space-y-4">
            <Section title="Dados Básicos" icon={FileText}>
                <Field label="Nome / Razão Social" value={favorecido.name} />
                <Field label="CPF / CNPJ" value={favorecido.document} />
                <Field label="Categoria" value={favorecido.category} />
                {(favorecido.type === 'funcionario' || favorecido.type === 'ambos') && (
                    <Field label="Categoria de Contratação" value={favorecido.categoria_contratacao} />
                )}
                {favorecido.notes && (
                    <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Observações</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{favorecido.notes}</p>
                    </div>
                )}
            </Section>

            <Section title="Contato" icon={Phone}>
                <Field label="Telefone" value={favorecido.phone} />
                <Field label="E-mail" value={favorecido.email} />
            </Section>

            <Section title="Endereço" icon={MapPin}>
                <Field label="Logradouro" value={favorecido.address} />
                <Field label="CEP" value={favorecido.zip_code} />
                <Field label="Cidade" value={favorecido.city} />
                <Field label="Estado" value={favorecido.state} />
            </Section>

            <Section title="Dados Bancários" icon={Landmark}>
                <Field label="Data de Nascimento" value={favorecido.birth_date ? formatDate(favorecido.birth_date) : null} />
                <Field
                    label="Forma de Pagamento Preferida"
                    value={favorecido.preferred_payment_type ? paymentTypeLabel[favorecido.preferred_payment_type] ?? favorecido.preferred_payment_type : null}
                />
                <Field label="Banco" value={favorecido.bank_name} />
                <Field label="Agência" value={favorecido.bank_agency} />
                <Field label="Conta" value={favorecido.bank_account} />
                <Field
                    label="Tipo de Conta"
                    value={favorecido.bank_account_type === 'corrente' ? 'Corrente' : favorecido.bank_account_type === 'poupanca' ? 'Poupança' : null}
                />
                <Field
                    label="Tipo de Chave PIX"
                    value={favorecido.pix_key_type ? pixKeyTypeLabel[favorecido.pix_key_type] ?? favorecido.pix_key_type : null}
                />
                <Field label="Chave PIX" value={favorecido.pix_key} />
            </Section>
        </div>
    );
}
