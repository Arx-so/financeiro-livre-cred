import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileText, Paperclip, ExternalLink, Eye, X, Download, FileImage, File, Loader2,
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getContractStatusBadge, ContractStatusType } from '@/components/shared/StatusBadge';
import {
    TERMINAL_LABELS, CARD_BRAND_LABELS, PAYMENT_METHOD_LABELS,
    TRANSFER_SOURCE_LABELS, SALE_TYPE_LABELS,
} from '@/constants/sales';
import type { ContractWithRelations } from '@/services/contratos';
import type { ContractFile } from '@/types/database';

interface ContractViewerModalProps {
    contract: ContractWithRelations | null;
    open: boolean;
    onClose: () => void;
}

function fmt(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        const d = date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00`);
        return format(d, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

function fmtDateTime(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return date;
    }
}

function getFileType(file: ContractFile): 'image' | 'pdf' | 'other' {
    const name = (file.file_name ?? file.file_url).toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return 'image';
    if (name.endsWith('.pdf')) return 'pdf';
    return 'other';
}

function FileIcon({ type }: { type: 'image' | 'pdf' | 'other' }) {
    if (type === 'image') return <FileImage className="w-4 h-4 shrink-0 text-blue-500" />;
    if (type === 'pdf') return <File className="w-4 h-4 shrink-0 text-red-500" />;
    return <Paperclip className="w-4 h-4 shrink-0 text-muted-foreground" />;
}

// ─── Document Preview Dialog ──────────────────────────────────────────────────

interface DocPreviewProps {
    file: ContractFile | null;
    onClose: () => void;
}

function extractStoragePath(url: string): string | null {
    const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/contracts\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
}

function DocPreview({ file, onClose }: DocPreviewProps) {
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!file) { setDisplayUrl(null); return; }
        const path = extractStoragePath(file.file_url);
        if (!path) { setDisplayUrl(file.file_url); return; }

        setLoading(true);
        supabase.storage.from('contracts').createSignedUrl(path, 3600)
            .then(({ data }) => {
                setDisplayUrl(data?.signedUrl ?? file.file_url);
            })
            .catch(() => setDisplayUrl(file.file_url))
            .finally(() => setLoading(false));
    }, [file]);

    if (!file) return null;
    const type = getFileType(file);
    const name = file.file_name ?? file.file_url;

    return (
        <Dialog open={!!file} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm font-medium truncate pr-4">{name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                        {displayUrl && (
                            <a href={displayUrl} download={name} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-1.5" />
                                    Baixar
                                </Button>
                            </a>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 min-h-[400px]">
                    {loading && <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />}
                    {!loading && displayUrl && type === 'image' && (
                        <img
                            src={displayUrl}
                            alt={name}
                            className="max-w-full max-h-[75vh] object-contain rounded"
                        />
                    )}
                    {!loading && displayUrl && type === 'pdf' && (
                        <iframe
                            src={`${displayUrl}#toolbar=1`}
                            title={name}
                            className="w-full h-[75vh] border-0"
                        />
                    )}
                    {!loading && type === 'other' && (
                        <div className="text-center space-y-3 p-8">
                            <Paperclip className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Pré-visualização não disponível para este tipo de arquivo.
                            </p>
                            {displayUrl && (
                                <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline">
                                        <ExternalLink className="w-4 h-4 mr-1.5" />
                                        Abrir em nova aba
                                    </Button>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Helper components ────────────────────────────────────────────────────────

interface FieldProps {
    label: string;
    value: React.ReactNode;
}

function Field({ label, value }: FieldProps) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-medium">{value || '—'}</p>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 pb-1 border-b">
                {title}
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {children}
            </div>
        </div>
    );
}

const RECURRENCE_LABELS: Record<string, string> = {
    unico: 'Único',
    mensal: 'Mensal',
    anual: 'Anual',
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ContractViewerModal({ contract, open, onClose }: ContractViewerModalProps) {
    const [previewFile, setPreviewFile] = useState<ContractFile | null>(null);

    if (!contract) return null;

    const isCC = !!(contract.cc_terminal || contract.cc_card_brand || contract.cc_lacre);
    const fee = contract.cc_amount_released && contract.value
        ? ((contract.value / contract.cc_amount_released - 1) * 100).toFixed(2)
        : null;

    const installmentsCount = (() => {
        if (contract.recurrence_type === 'unico' || !contract.end_date) return 1;
        try {
            const start = new Date(`${contract.start_date}T00:00:00`);
            const end = new Date(`${contract.end_date}T00:00:00`);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
            return Math.max(1, months);
        } catch { return null; }
    })();

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-base leading-tight">{contract.title}</DialogTitle>
                                <div className="mt-1.5">
                                    {getContractStatusBadge(contract.status as ContractStatusType)}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 pt-2">
                        {/* Partes */}
                        <Section title="Partes">
                            <Field label="Cliente" value={contract.favorecido?.name} />
                            <Field label="Vendedor" value={contract.seller?.name} />
                            <Field label="Produto" value={
                                contract.product
                                    ? `${contract.product.name}${contract.product.code ? ` (${contract.product.code})` : ''}`
                                    : null
                            } />
                            <Field label="Categoria" value={contract.category?.name} />
                        </Section>

                        {/* Contrato */}
                        <Section title="Contrato">
                            <Field label="Valor total" value={fmt(contract.value)} />
                            <Field label="Tipo / Descrição" value={contract.type || '—'} />
                            <Field label="Data início" value={fmtDate(contract.start_date)} />
                            <Field label="Data fim" value={fmtDate(contract.end_date)} />
                            <Field label="Recorrência" value={RECURRENCE_LABELS[contract.recurrence_type] ?? contract.recurrence_type} />
                            {installmentsCount != null && (
                                <Field label="Parcelas" value={String(installmentsCount)} />
                            )}
                            {contract.payment_due_day != null && (
                                <Field label="Dia vencimento" value={String(contract.payment_due_day)} />
                            )}
                            {contract.interest_rate != null && (
                                <Field label="Taxa de juros" value={`${contract.interest_rate}%`} />
                            )}
                        </Section>

                        {/* Cartão de Crédito */}
                        {isCC && (
                            <Section title="Cartão de Crédito">
                                {contract.cc_terminal && (
                                    <Field label="Terminal" value={TERMINAL_LABELS[contract.cc_terminal] ?? contract.cc_terminal} />
                                )}
                                {contract.cc_card_brand && (
                                    <Field label="Bandeira" value={CARD_BRAND_LABELS[contract.cc_card_brand] ?? contract.cc_card_brand} />
                                )}
                                {contract.cc_card_last_four && (
                                    <Field label="Cartão" value={`**** ${contract.cc_card_last_four}`} />
                                )}
                                {contract.cc_card_holder_name && (
                                    <Field label="Titular" value={contract.cc_card_holder_name} />
                                )}
                                {contract.cc_sale_type && (
                                    <Field label="Tipo de venda" value={SALE_TYPE_LABELS[contract.cc_sale_type] ?? contract.cc_sale_type} />
                                )}
                                {contract.cc_amount_released != null && (
                                    <Field label="Valor maquineta" value={fmt(contract.cc_amount_released)} />
                                )}
                                {fee && (
                                    <Field label="Taxa calculada" value={`${fee}%`} />
                                )}
                                {contract.cc_payment_method && (
                                    <Field label="Forma de pagamento" value={PAYMENT_METHOD_LABELS[contract.cc_payment_method] ?? contract.cc_payment_method} />
                                )}
                                {contract.cc_payment_account && (
                                    <Field label="Conta" value={TRANSFER_SOURCE_LABELS[contract.cc_payment_account] ?? contract.cc_payment_account} />
                                )}
                                {(contract.cc_discount_amount ?? 0) > 0 && (
                                    <Field label="Desconto" value={fmt(contract.cc_discount_amount!)} />
                                )}
                                {(contract.cc_saturday_refund ?? 0) > 0 && (
                                    <Field label="Devolução sábado" value={fmt(contract.cc_saturday_refund!)} />
                                )}
                                {contract.cc_lacre && (
                                    <Field label="Lacre" value={contract.cc_lacre} />
                                )}
                            </Section>
                        )}

                        {/* Observações */}
                        {contract.notes && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 pb-1 border-b">
                                    Observações
                                </p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
                            </div>
                        )}

                        {/* Histórico */}
                        <Section title="Histórico">
                            <Field label="Criado em" value={fmtDateTime(contract.created_at)} />
                            {contract.creator?.name && (
                                <Field label="Criado por" value={contract.creator.name} />
                            )}
                            <Field label="Atualizado em" value={fmtDateTime(contract.updated_at)} />
                            {contract.signed_at && (
                                <Field label="Assinado em" value={fmtDateTime(contract.signed_at)} />
                            )}
                            {contract.signed_by && (
                                <Field label="Assinado por" value={contract.signed_by} />
                            )}
                        </Section>

                        {/* Arquivos */}
                        {contract.files && contract.files.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 pb-1 border-b">
                                    {`Arquivos (${contract.files.length})`}
                                </p>
                                <div className="space-y-2">
                                    {contract.files.map((file) => {
                                        const type = getFileType(file);
                                        const name = file.file_name ?? file.file_url;
                                        return (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/30"
                                            >
                                                <FileIcon type={type} />
                                                <span className="text-sm flex-1 truncate" title={name}>{name}</span>
                                                <button
                                                    type="button"
                                                    className="btn-secondary py-1 px-2 text-xs"
                                                    onClick={() => setPreviewFile(file)}
                                                    title="Visualizar"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Ver
                                                </button>
                                                <a
                                                    href={file.file_url}
                                                    download={name}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-secondary py-1 px-2 text-xs"
                                                    title="Baixar"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <DocPreview file={previewFile} onClose={() => setPreviewFile(null)} />
        </>
    );
}
