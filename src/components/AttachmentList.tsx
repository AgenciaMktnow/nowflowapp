import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export type Attachment = {
    id: string;
    task_id: string;
    user_id: string | null; // owner
    name: string;
    size: number;
    type: string;
    path: string;
    created_at: string;
};

interface AttachmentListProps {
    attachments: Attachment[];
    onDelete: (id: string) => void;
    currentUser: {
        id: string;
        role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CLIENT';
    } | null;
}

export default function AttachmentList({ attachments, onDelete, currentUser }: AttachmentListProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getIcon = (type: string) => {
        if (type.startsWith('image/')) return 'image';
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return 'table_view';
        if (type.includes('video')) return 'movie';
        return 'description';
    };

    const handleDownload = async (attachment: Attachment) => {
        try {
            const { data, error } = await supabase.storage
                .from('task-attachments')
                .download(attachment.path);

            if (error) throw error;

            // Create blob link to download
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Erro ao baixar arquivo.');
        }
    };

    const handlePreview = async (attachment: Attachment) => {
        if (!attachment.type.startsWith('image/')) {
            handleDownload(attachment);
            return;
        }

        // Get public URL for preview
        const { data } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(attachment.path);

        setPreviewUrl(data.publicUrl);
    };

    if (attachments.length === 0) return null;

    return (
        <div className="mt-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">attachment</span>
                Anexos ({attachments.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((file) => {
                    // Permission Check
                    const canDelete = currentUser && (
                        currentUser.role === 'ADMIN' ||
                        currentUser.id === file.user_id
                    );

                    return (
                        <div
                            key={file.id}
                            className="group flex items-center p-2 rounded-lg bg-[#14261d] border border-[#23482f] hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => handlePreview(file)}
                        >
                            {/* File Icon / Thumbnail */}
                            <div className="size-10 rounded bg-[#1a3524] flex items-center justify-center text-[#92c9a4] mr-3 border border-[#23482f]">
                                <span className="material-symbols-outlined">{getIcon(file.type)}</span>
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate pr-6" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-[#14261d]/80 backdrop-blur-sm rounded pl-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                    className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-primary transition-colors"
                                    title="Baixar"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>

                                {canDelete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                                        className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500 transition-colors"
                                        title="Excluir"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Image Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-[-40px] right-0 text-white hover:text-primary transition-colors flex items-center gap-1"
                            onClick={() => setPreviewUrl(null)}
                        >
                            <span className="material-symbols-outlined">close</span>
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
