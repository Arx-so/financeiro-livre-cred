import { useRef } from 'react';
import {
    Upload, Trash2, Download, File, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState, LoadingState } from '@/components/shared';
import {
    useFavorecidoDocuments,
    useUploadFavorecidoDocument,
    useDeleteFavorecidoDocument,
} from '@/hooks/useCadastros';
import { useAuthStore } from '@/stores';
import { useQueryClient } from '@tanstack/react-query';
import { cadastrosKeys } from '@/hooks/useCadastros';

interface TabDocumentosProps {
    favorecidoId: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDocDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar';

export function TabDocumentos({ favorecidoId }: TabDocumentosProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading } = useFavorecidoDocuments(favorecidoId);
    const uploadMutation = useUploadFavorecidoDocument();
    const deleteMutation = useDeleteFavorecidoDocument();

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        for (const file of files) {
            try {
                await uploadMutation.mutateAsync({
                    favorecidoId,
                    file,
                    uploadedBy: user?.name ?? undefined,
                });
            } catch {
                toast.error(`Erro ao enviar ${file.name}`);
            }
        }
        toast.success('Documento(s) enviado(s) com sucesso!');
        queryClient.invalidateQueries({ queryKey: cadastrosKeys.documents(favorecidoId) });
        if (inputRef.current) inputRef.current.value = '';
    }

    async function handleDelete(docId: string, fileName: string) {
        try {
            await deleteMutation.mutateAsync(docId);
            toast.success(`${fileName} removido.`);
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.documents(favorecidoId) });
        } catch {
            toast.error('Erro ao remover documento');
        }
    }

    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED}
                    className="hidden"
                    onChange={handleUpload}
                />
                <button
                    className="btn-primary"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                >
                    {uploadMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    Anexar Documento
                </button>
            </div>

            {documents.length === 0 ? (
                <EmptyState icon={File} message="Nenhum documento anexado" />
            ) : (
                <div className="card-financial divide-y divide-border">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-3 p-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <File className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatBytes(doc.file_size)} · {formatDocDate(doc.created_at)}
                                        {doc.uploaded_by && ` · ${doc.uploaded_by}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-ghost p-2 text-muted-foreground hover:text-primary"
                                    title="Baixar"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    className="btn-ghost p-2 text-destructive hover:bg-destructive/10"
                                    title="Excluir"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => handleDelete(doc.id, doc.file_name)}
                                >
                                    {deleteMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
