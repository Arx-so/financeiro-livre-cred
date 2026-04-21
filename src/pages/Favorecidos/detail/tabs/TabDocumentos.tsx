import { useRef, useState, useEffect } from 'react';
import {
    Upload, Trash2, Download, File, Loader2, Eye, Paperclip, FileImage, ExternalLink, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState, LoadingState } from '@/components/shared';
import {
    useFavorecidoDocuments,
    useUploadFavorecidoDocument,
    useDeleteFavorecidoDocument,
    cadastrosKeys,
} from '@/hooks/useCadastros';
import { useAuthStore } from '@/stores';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { FavorecidoDocument } from '@/types/database';

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

function getFileType(doc: FavorecidoDocument): 'image' | 'pdf' | 'other' {
    const name = (doc.file_name ?? doc.file_url).toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return 'image';
    if (name.endsWith('.pdf')) return 'pdf';
    return 'other';
}

function FileTypeIcon({ type }: { type: 'image' | 'pdf' | 'other' }) {
    if (type === 'image') return <FileImage className="w-4 h-4 text-blue-500" />;
    if (type === 'pdf') return <File className="w-4 h-4 text-red-500" />;
    return <Paperclip className="w-4 h-4 text-muted-foreground" />;
}

// ─── Document Preview Dialog ──────────────────────────────────────────────────

function extractStoragePath(url: string): string | null {
    const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/documents\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
}

interface DocPreviewProps {
    file: FavorecidoDocument | null;
    onClose: () => void;
}

function DocPreview({ file, onClose }: DocPreviewProps) {
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!file) { setDisplayUrl(null); return; }
        const path = extractStoragePath(file.file_url);
        if (!path) { setDisplayUrl(file.file_url); return; }

        setLoading(true);
        supabase.storage.from('documents').createSignedUrl(path, 3600)
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

// ─── Tab Component ────────────────────────────────────────────────────────────

export function TabDocumentos({ favorecidoId }: TabDocumentosProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [previewFile, setPreviewFile] = useState<FavorecidoDocument | null>(null);

    const { data: documents = [], isLoading } = useFavorecidoDocuments(favorecidoId);
    const uploadMutation = useUploadFavorecidoDocument();
    const deleteMutation = useDeleteFavorecidoDocument();

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        let successCount = 0;
        for (const file of files) {
            try {
                await uploadMutation.mutateAsync({
                    favorecidoId,
                    file,
                    uploadedBy: user?.id ?? undefined,
                });
                successCount += 1;
            } catch {
                toast.error(`Erro ao enviar ${file.name}`);
            }
        }
        if (successCount > 0) {
            toast.success('Documento(s) enviado(s) com sucesso!');
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.documents(favorecidoId) });
        }
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
        <>
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
                        {documents.map((doc) => {
                            const type = getFileType(doc);
                            return (
                                <div key={doc.id} className="flex items-center gap-3 p-4">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileTypeIcon type={type} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatBytes(doc.file_size)} · {formatDocDate(doc.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            className="btn-ghost p-2 text-muted-foreground hover:text-primary"
                                            title="Visualizar"
                                            onClick={() => setPreviewFile(doc)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
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
                            );
                        })}
                    </div>
                )}
            </div>

            <DocPreview file={previewFile} onClose={() => setPreviewFile(null)} />
        </>
    );
}
