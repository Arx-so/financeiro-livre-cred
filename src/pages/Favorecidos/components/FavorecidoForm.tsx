import {
    Upload,
    Camera,
    Loader2,
    FileText,
    Download,
    Landmark,
    Trash2,
    History,
    Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { DocumentInput } from '@/components/ui/document-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { CepInput } from '@/components/ui/cep-input';
import { LoadingState } from '@/components/shared';
import { getActionText, formatLogDetails } from '@/services/activityLogs';
import { formatFileSize, getFileIcon } from '@/services/cadastros';
import type { FavorecidoTipo, BankAccountType, PixKeyType, PaymentType } from '@/types/database';

interface FavorecidoFormProps {
    formData: any;
    setFormData: (data: any) => void;
    editingId: string | null;
    photoPreview: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    documentInputRef: React.RefObject<HTMLInputElement>;
    favorecidoDocuments: any[];
    documentsLoading: boolean;
    favorecidoLogs: any[];
    logsLoading: boolean;
    isUploadingDocument: boolean;
    isSaving: boolean;
    onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteDocument: (docId: string, fileName: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function FavorecidoForm(props: FavorecidoFormProps) {
    const {
        formData, setFormData, editingId, photoPreview, fileInputRef, documentInputRef,
        favorecidoDocuments, documentsLoading, favorecidoLogs, logsLoading,
        isUploadingDocument, isSaving, onPhotoSelect, onDocumentUpload, onDeleteDocument,
        onSubmit, onCancel,
    } = props;

    return (
        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
                <div
                    className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                </div>
                <div>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-4 h-4" />
                        Upload Foto
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF até 5MB</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPhotoSelect}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                    <select
                        className="input-financial"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as FavorecidoTipo })}
                    >
                        <option value="cliente">Cliente</option>
                        <option value="fornecedor">Fornecedor</option>
                        <option value="funcionario">Funcionário</option>
                        <option value="ambos">Cliente e Fornecedor</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="Ex: Premium, VIP, Vendedor"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome / Razão Social *</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Nome completo ou razão social"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CPF/CNPJ</label>
                    <DocumentInput
                        value={formData.document}
                        onChange={(value) => setFormData({ ...formData, document: value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                    <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                    type="email"
                    className="input-financial"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                <input
                    type="text"
                    className="input-financial"
                    placeholder="Rua, número, bairro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                    <CepInput
                        value={formData.zip_code}
                        onChange={(value) => setFormData({ ...formData, zip_code: value })}
                        onAddressFound={(address) => {
                            setFormData((prev: any) => ({
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
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                    <input
                        type="text"
                        className="input-financial"
                        placeholder="UF"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                <textarea
                    className="input-financial min-h-[80px]"
                    placeholder="Observações adicionais"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>

            {/* Banking Section */}
            <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                    <Landmark className="w-4 h-4 text-primary" />
                    <label className="block text-sm font-medium text-foreground">Dados Bancários</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Data de Nascimento</label>
                        <input
                            type="date"
                            className="input-financial"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Forma de Pagamento Preferida</label>
                        <select
                            className="input-financial"
                            value={formData.preferred_payment_type}
                            onChange={(e) => setFormData({ ...formData, preferred_payment_type: e.target.value as PaymentType | '' })}
                        >
                            <option value="">Selecione</option>
                            <option value="pix">PIX</option>
                            <option value="ted">TED</option>
                            <option value="boleto">Boleto</option>
                            <option value="cartao">Cartão</option>
                            <option value="dinheiro">Dinheiro</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo Chave PIX</label>
                        <select
                            className="input-financial"
                            value={formData.pix_key_type}
                            onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value as PixKeyType | '' })}
                        >
                            <option value="">Selecione</option>
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                            <option value="email">E-mail</option>
                            <option value="telefone">Telefone</option>
                            <option value="aleatoria">Chave Aleatória</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Chave PIX</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="Chave PIX"
                            value={formData.pix_key}
                            onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Banco</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="Nome do banco"
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Agência</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="0000"
                            value={formData.bank_agency}
                            onChange={(e) => setFormData({ ...formData, bank_agency: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Conta</label>
                        <input
                            type="text"
                            className="input-financial"
                            placeholder="00000-0"
                            value={formData.bank_account}
                            onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                        <select
                            className="input-financial"
                            value={formData.bank_account_type}
                            onChange={(e) => setFormData({ ...formData, bank_account_type: e.target.value as BankAccountType | '' })}
                        >
                            <option value="">Selecione</option>
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Documents Section */}
            <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Documentos
                    </label>
                    {editingId && (
                        <>
                            <button
                                type="button"
                                className="btn-secondary text-sm py-1"
                                onClick={() => documentInputRef.current?.click()}
                                disabled={isUploadingDocument}
                            >
                                {isUploadingDocument ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                Anexar
                            </button>
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
                                className="hidden"
                                multiple
                                onChange={onDocumentUpload}
                            />
                        </>
                    )}
                </div>

                {!editingId ? (
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Salve o cadastro primeiro para adicionar documentos
                        </p>
                    </div>
                ) : documentsLoading ? (
                    <LoadingState size="sm" />
                ) : favorecidoDocuments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {favorecidoDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg flex-shrink-0">{getFileIcon(doc.file_type)}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate" title={doc.file_name}>
                                            {doc.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(doc.file_size)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4 text-muted-foreground" />
                                    </a>
                                    <button
                                        type="button"
                                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                        onClick={() => onDeleteDocument(doc.id, doc.file_name)}
                                        title="Remover"
                                    >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum documento anexado
                    </p>
                )}
            </div>

            {/* Activity Log Section */}
            {editingId && (
                <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-primary" />
                        <label className="block text-sm font-medium text-foreground">Histórico de Atividades</label>
                    </div>

                    {logsLoading ? (
                        <LoadingState size="sm" />
                    ) : favorecidoLogs.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {favorecidoLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg"
                                >
                                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-foreground">
                                                {getActionText(log.action)}
                                            </p>
                                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        {log.user_name && (
                                            <p className="text-xs text-muted-foreground">
                                                por
                                                {' '}
                                                {log.user_name}
                                            </p>
                                        )}
                                        {log.details && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatLogDetails(log.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum histórico registrado
                        </p>
                    )}
                </div>
            )}

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
                    {editingId ? 'Atualizar' : 'Salvar'}
                    {' '}
                    Cadastro
                </button>
            </div>
        </form>
    );
}
