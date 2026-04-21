import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/shared';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { FavorecidoForm } from '../components/FavorecidoForm';
import { FavorecidoDetailHeader } from './FavorecidoDetailHeader';
import { TabCadastro } from './tabs/TabCadastro';
import { TabFinanceiro } from './tabs/TabFinanceiro';
import { TabVendas } from './tabs/TabVendas';
import { TabContratos } from './tabs/TabContratos';
import { TabDocumentos } from './tabs/TabDocumentos';
import { TabRH } from './tabs/TabRH';
import { TabHistorico } from './tabs/TabHistorico';
import { useFavorecidoDetail } from './useFavorecidoDetail';
import {
    useUpdateFavorecido,
    useUploadFavorecidoPhoto,
    useDeleteFavorecidoPhoto,
    useFavorecidoDocuments,
    useUploadFavorecidoDocument,
    useDeleteFavorecidoDocument,
} from '@/hooks/useCadastros';
import { useEntityLogs } from '@/hooks/useActivityLogs';
import { useAuthStore } from '@/stores';
import type { FavorecidoTipo, BankAccountType, PixKeyType } from '@/types/database';
import type { FavorecidoFormData } from '../useFavorecidosPage';

const initialForm: FavorecidoFormData = {
    type: 'cliente',
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    category: '',
    categoria_contratacao: '',
    notes: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: '',
    pix_key: '',
    pix_key_type: '',
    preferred_payment_type: '',
    birth_date: '',
};

export default function FavorecidoDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const {
        favorecido: favorecidoQuery,
        financialEntries,
        contracts,
        creditCardSales,
        dplusSales,
        payrolls,
        vacations,
        exams,
        logs,
        kpis,
    } = useFavorecidoDetail(id!);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [formData, setFormData] = useState<FavorecidoFormData>(initialForm);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const updateMutation = useUpdateFavorecido();
    const uploadPhotoMutation = useUploadFavorecidoPhoto();
    const deletePhotoMutation = useDeleteFavorecidoPhoto();
    const uploadDocMutation = useUploadFavorecidoDocument();
    const deleteDocMutation = useDeleteFavorecidoDocument();

    const { data: editDocuments = [], isLoading: docsLoading } = useFavorecidoDocuments(id!);
    const { data: editLogs = [], isLoading: logsLoading } = useEntityLogs('favorecido', id!);

    const fav = favorecidoQuery.data;

    function openEdit() {
        if (!fav) return;
        setFormData({
            type: fav.type,
            name: fav.name,
            document: fav.document ?? '',
            email: fav.email ?? '',
            phone: fav.phone ?? '',
            address: fav.address ?? '',
            city: fav.city ?? '',
            state: fav.state ?? '',
            zip_code: fav.zip_code ?? '',
            category: fav.category ?? '',
            categoria_contratacao: fav.categoria_contratacao ?? '',
            notes: fav.notes ?? '',
            bank_name: fav.bank_name ?? '',
            bank_agency: fav.bank_agency ?? '',
            bank_account: fav.bank_account ?? '',
            bank_account_type: (fav.bank_account_type as BankAccountType) ?? '',
            pix_key: fav.pix_key ?? '',
            pix_key_type: (fav.pix_key_type as PixKeyType) ?? '',
            preferred_payment_type: fav.preferred_payment_type ?? '',
            birth_date: fav.birth_date ?? '',
        });
        setPhotoPreview(fav.photo_url ?? null);
        setIsEditOpen(true);
    }

    async function handleSubmit() {
        if (!id) return;
        try {
            await updateMutation.mutateAsync({
                id,
                favorecido: {
                    ...formData,
                    bank_account_type: formData.bank_account_type as BankAccountType | null || null,
                    pix_key_type: formData.pix_key_type as PixKeyType | null || null,
                    preferred_payment_type: formData.preferred_payment_type as any || null,
                    birth_date: formData.birth_date || null,
                },
            });
            toast.success('Favorecido atualizado!');
            setIsEditOpen(false);
        } catch {
            toast.error('Erro ao salvar alterações');
        }
    }

    function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !id) return;
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
        uploadPhotoMutation.mutate({ favorecidoId: id, file });
    }

    function handleRemovePhoto() {
        if (!id || !fav?.photo_url) return;
        deletePhotoMutation.mutate({ favorecidoId: id, photoUrl: fav.photo_url });
        setPhotoPreview(null);
    }

    function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        files.forEach((file) => {
            uploadDocMutation.mutate({
                favorecidoId: id!,
                file,
                uploadedBy: user?.name ?? undefined,
            });
        });
    }

    function handleDeleteDocument(docId: string) {
        deleteDocMutation.mutate(docId);
    }

    if (favorecidoQuery.isLoading) {
        return (
            <AppLayout>
                <LoadingState />
            </AppLayout>
        );
    }

    if (!fav) {
        return (
            <AppLayout>
                <div className="text-center py-12 text-muted-foreground">
                    <p>Favorecido não encontrado.</p>
                    <button className="btn-primary mt-4" onClick={() => navigate('/favorecidos')}>
                        Voltar
                    </button>
                </div>
            </AppLayout>
        );
    }

    const isEmployee = fav.type === 'funcionario' || fav.type === 'ambos';
    const isClient = fav.type === 'cliente' || fav.type === 'ambos';
    const isSupplier = fav.type === 'fornecedor' || fav.type === 'ambos';
    const hasSales = isClient || isEmployee;
    const hasContracts = isClient || isSupplier;

    return (
        <AppLayout>
            <div className="space-y-6">
                <FavorecidoDetailHeader favorecido={fav} kpis={kpis} onEdit={openEdit} />

                <Tabs defaultValue="cadastro">
                    <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
                        <TabsTrigger value="financeiro">
                            Financeiro ({financialEntries.data?.length ?? 0})
                        </TabsTrigger>
                        {hasSales && (
                            <TabsTrigger value="vendas">
                                Vendas ({(creditCardSales.data?.length ?? 0) + (dplusSales.data?.length ?? 0)})
                            </TabsTrigger>
                        )}
                        {hasContracts && (
                            <TabsTrigger value="contratos">
                                Contratos ({contracts.data?.length ?? 0})
                            </TabsTrigger>
                        )}
                        {isEmployee && (
                            <TabsTrigger value="rh">RH</TabsTrigger>
                        )}
                        <TabsTrigger value="documentos">
                            Documentos ({editDocuments.length})
                        </TabsTrigger>
                        <TabsTrigger value="historico">
                            Histórico ({editLogs.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="cadastro">
                            <TabCadastro favorecido={fav} />
                        </TabsContent>

                        <TabsContent value="financeiro">
                            <TabFinanceiro
                                entries={financialEntries.data ?? []}
                                isLoading={financialEntries.isLoading}
                                kpis={kpis}
                            />
                        </TabsContent>

                        {hasSales && (
                            <TabsContent value="vendas">
                                <TabVendas
                                    creditCardSales={creditCardSales.data ?? []}
                                    dplusSales={dplusSales.data ?? []}
                                    ccLoading={creditCardSales.isLoading}
                                    dplusLoading={dplusSales.isLoading}
                                />
                            </TabsContent>
                        )}

                        {hasContracts && (
                            <TabsContent value="contratos">
                                <TabContratos
                                    contracts={contracts.data ?? []}
                                    isLoading={contracts.isLoading}
                                />
                            </TabsContent>
                        )}

                        {isEmployee && (
                            <TabsContent value="rh">
                                <TabRH
                                    payrolls={payrolls.data ?? []}
                                    vacations={vacations.data ?? []}
                                    exams={exams.data ?? []}
                                    payrollLoading={payrolls.isLoading}
                                    vacationsLoading={vacations.isLoading}
                                    examsLoading={exams.isLoading}
                                />
                            </TabsContent>
                        )}

                        <TabsContent value="documentos">
                            <TabDocumentos favorecidoId={id!} />
                        </TabsContent>

                        <TabsContent value="historico">
                            <TabHistorico
                                logs={editLogs}
                                isLoading={logsLoading}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Favorecido</DialogTitle>
                        <DialogDescription>Atualize os dados do cadastro.</DialogDescription>
                    </DialogHeader>
                    <FavorecidoForm
                        formData={formData}
                        setFormData={setFormData}
                        editingId={id}
                        photoPreview={photoPreview}
                        fileInputRef={fileInputRef}
                        cameraInputRef={cameraInputRef}
                        documentInputRef={documentInputRef}
                        favorecidoDocuments={editDocuments}
                        documentsLoading={docsLoading}
                        favorecidoLogs={editLogs}
                        logsLoading={logsLoading}
                        isUploadingDocument={uploadDocMutation.isPending}
                        isDeletingPhoto={deletePhotoMutation.isPending}
                        isSaving={updateMutation.isPending}
                        onPhotoSelect={handlePhotoSelect}
                        onRemovePhoto={handleRemovePhoto}
                        onDocumentUpload={handleDocumentUpload}
                        onDeleteDocument={handleDeleteDocument}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
