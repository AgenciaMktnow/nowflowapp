import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SimpleEditor from '../components/SimpleEditor';
import { Editor } from '@tiptap/react';
import ActivityFeed from '../components/ActivityFeed';
import { logActivity } from '../services/activityLogger';
import { taskService } from '../services/task.service';


import { compressImage } from '../utils/imageCompression';
import { boardService, type Column } from '../services/board.service';
import { toast } from 'sonner';
import AttachmentList, { type Attachment } from '../components/AttachmentList';
import Header from '../components/layout/Header/Header';
import EmojiPicker, { Theme } from 'emoji-picker-react';


import type { Board } from '../types/database.types';

const Portal = ({ children }: { children: React.ReactNode }) => {
    return createPortal(children, document.body);
};


type Task = {
    id: string;
    task_number: number;
    title: string;
    description: string;
    status: string;
    column_id?: string; // Added column_id
    priority: string;
    due_date: string;
    created_at: string;
    created_by?: string;
    assignee?: {
        id: string;
        full_name: string;
        email: string;
    };
    creator?: {
        id: string;
        full_name: string;
        email: string;
    };
    tags?: string[];
    attachments?: Attachment[];
    client?: {
        id: string;
        name: string;
    };
    project?: {
        id: string;
        name: string;
        board_id: string;
    };
    workflow?: {
        id: string;
        name: string;
        steps: any[];
    };
    // Consolidated list of assignees
    task_assignees?: {
        user: {
            id: string;
            full_name: string;
            email: string;
            avatar_url?: string;
        }
    }[];
    board_ids?: string[];
};

type Comment = {
    id: string;
    content: string;
    created_at: string;
    user: {
        full_name: string;
        email: string;
    };
};

type ChecklistItem = {
    id: string;
    text: string;
    completed: boolean;
};

// ... unused imports like EmojiPicker might be needed later, keeping specific ones if referenced




export default function TaskDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, userProfile } = useAuth();
    const timerInterval = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (showStageDropdown && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });

            // Close on scroll/resize logic
            const handleScroll = (e: Event) => {
                // Ignore scroll events originating from within the dropdown itself
                const target = e.target as HTMLElement;
                if (target?.closest?.('.stage-dropdown-content')) return;

                setShowStageDropdown(false);
            };

            // Close on click outside
            const handleClickOutside = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (triggerRef.current && triggerRef.current.contains(target)) return;
                if (target?.closest?.('.stage-dropdown-content')) return;
                setShowStageDropdown(false);
            };

            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
            window.addEventListener('mousedown', handleClickOutside);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
                window.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showStageDropdown]);

    const [task, setTask] = useState<Task | null>(null);
    const [editor, setEditor] = useState<Editor | null>(null);




    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0); // Wrapper to prevent flicker on child elements

    // Clone Task State
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneOptions, setCloneOptions] = useState({
        description: true,
        assignees: false,
        attachments: false,
        comments: false,
        client: true,
        project: true,
        flow: true,
        date: true
    });
    const [cloning, setCloning] = useState(false);

    // Time tracking
    const [isTracking, setIsTracking] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds
    const [historicTime, setHistoricTime] = useState(0); // Total from previous sessions
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

    // Checklist
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

    // Multi-Board State
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            fetchTask();
        }
    }, [id]);

    useEffect(() => {
        if (task) {
            fetchComments();
            // checkActiveTimeEntry is called inside checkHelper which also fetches history
            // checkActiveTimeEntry is called inside checkHelper which also fetches history
            checkTimeData();
            // Extract checklist from description
            if (task.description) {
                const items = extractChecklistFromHtml(task.description);
                setChecklistItems(items);
            }

            // Set selected boards
            if (task.id) { // Ensure we have the UUID
                fetchTaskBoards(task.id);
                fetchAttachments(task.id);
            }
        }
    }, [task]);

    // Handle Deep Link Scrolling
    useEffect(() => {
        if (task && searchParams.get('tab') === 'comments') {
            // Short delay to ensure rendering
            setTimeout(() => {
                const element = document.getElementById('comments-section');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
        }
    }, [task, searchParams]);

    // Fetch boards list once
    useEffect(() => {
        const fetchBoards = async () => {
            const { data } = await supabase.from('boards').select('*').order('name');
            if (data) setBoards(data);
        };
        fetchBoards();
    }, []);

    // Fix: Trigger fetchBoardColumns when boards are identified
    useEffect(() => {
        if (selectedBoardIds.length > 0) {
            // Fetch columns for the first linked board to populate the dropdown
            fetchBoardColumns(selectedBoardIds[0]);
        }
    }, [selectedBoardIds]);

    useEffect(() => {
        if (isTracking) {
            timerInterval.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        }

        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        };
    }, [isTracking]);

    // Visiblity Change Handler to Re-Sync Timer on Tab Focus
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isTracking) {
                console.log('Tab visible - Resyncing timer...');
                checkActiveTimeEntry();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isTracking]);

    const fetchComments = async () => {
        if (!task) return;

        const { data, error } = await supabase
            .from('task_comments')
            .select(`
                *,
                user:users(full_name, email, avatar_url)
            `)
            .eq('task_id', task.id)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setComments(data as any);
        }
    };
    const checkActiveTimeEntry = async () => {
        if (!task) return;

        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('task_id', task.id)
                .is('end_time', null)
                .maybeSingle();

            if (!error && data) {
                setCurrentEntryId(data.id);
                setIsTracking(true);
                // Calculate elapsed time
                const startTime = new Date(data.start_time).getTime();
                const now = new Date().getTime();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }
        } catch (error) {
            // Silently handle - 400 errors are expected when no active timer
            setCurrentEntryId(null);
            setIsTracking(false);
        }
    };


    const checkTimeData = async () => {
        if (!task) return;

        // 1. Fetch Historic Total (sum of all completed logs)
        try {
            const { data: historyData, error: historyError } = await supabase
                .from('time_logs')
                .select('duration_seconds')
                .eq('task_id', task.id)
                .not('end_time', 'is', null);

            if (!historyError && historyData) {
                const total = historyData.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
                setHistoricTime(Math.max(0, total)); // Ensure no negative total in UI state
            }
        } catch (e) {
            console.error('Error fetching time history:', e);
        }

        // 2. Check for Active Entry
        await checkActiveTimeEntry();
    };

    // Dynamic Columns
    const [boardColumns, setBoardColumns] = useState<Column[]>([]);



    const fetchBoardColumns = async (boardId: string) => {
        try {
            const { data } = await boardService.getBoardColumns(boardId);
            if (data) {
                setBoardColumns(data);
            }
        } catch (error) {
            console.error('Error fetching board columns:', error);
        }
    };

    const fetchTaskBoards = async (taskId: string) => {
        const { data } = await supabase.from('task_boards').select('board_id').eq('task_id', taskId);
        if (data) {
            const ids = data.map(d => d.board_id);
            // If no boards (legacy), maybe fallback to project's board? 
            // Logic: If task.project.board_id exists and not in list, maybe should add?
            // For now, raw truth from task_boards.
            if (ids.length === 0 && task?.project?.board_id) {
                setSelectedBoardIds([task.project.board_id]);
            } else {
                setSelectedBoardIds(ids);
            }
        }
    };



    const fetchAttachments = async (taskId: string) => {
        const { data } = await supabase
            .from('task_attachments')
            .select('*')
            .eq('task_id', taskId)
            .order('created_at', { ascending: false });

        if (data) setAttachments(data as any);
    };

    const fetchTask = async () => {

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assignee:users!tasks_assignee_id_fkey(id, full_name, email),
                    creator:users!tasks_created_by_fkey(id, full_name, email),
                    client:clients(id, name),
                    project:projects(id, name, board_id),
                    workflow:workflows(id, name, steps),
                    task_assignees(
                        user:users(id, full_name, email, avatar_url)
                    ),
                    task_boards(board_id)
                `)
                .eq('task_number', id) // Query by task_number using the URL param
                .single();

            if (error) throw error;

            // Map task_boards to board_ids for compatibility
            const taskWithBoards = {
                ...data,
                board_ids: data.task_boards?.map((tb: any) => tb.board_id) || []
            };

            setTask(taskWithBoards);
        } catch (error) {
            console.error('Error fetching task:', error);
            alert('Erro ao carregar tarefa');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTimer = async () => {
        if (!user || !task) return;
        try {
            const { data, error } = await taskService.startTimer(task.id, user.id);

            if (error) throw error;

            if (data) {
                setCurrentEntryId(data.id);
                setIsTracking(true);
                setElapsedTime(0);
                if (user && task) await logActivity(task.id, user.id, 'TIMER_START', 'iniciou o timer');
            }

            // Auto-update local state since service handles DB
            if (task.status !== 'IN_PROGRESS') {
                setTask(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null);
            }

        } catch (error: any) {
            console.error('Error starting timer:', error);
            alert(`Erro ao iniciar timer: ${error?.message}`);
        }
    };

    const handlePauseTimer = async () => {
        if (!currentEntryId) return;

        try {
            const { error } = await supabase
                .from('time_logs')
                .update({
                    end_time: new Date().toISOString(),
                    duration_seconds: elapsedTime
                })
                .eq('id', currentEntryId);

            if (error) throw error;

            // Update status to WAITING_CLIENT (Paused)
            if (task) {
                const { error: statusError } = await supabase
                    .from('tasks')
                    .update({ status: 'WAITING_CLIENT' })
                    .eq('id', task.id);

                if (!statusError) {
                    setTask(prev => prev ? { ...prev, status: 'WAITING_CLIENT' } : null);
                }
            }

            setIsTracking(false);
            setCurrentEntryId(null);

            // Update local state to reflect new history without refetching
            setHistoricTime(prev => prev + elapsedTime);
            setElapsedTime(0);
            if (user && task) await logActivity(task.id, user.id, 'TIMER_STOP', 'pausou o timer');
        } catch (error: any) {
            console.error('Error pausing timer:', error);
            alert(`Erro ao pausar timer: ${error?.message}`);
        }
    };

    const [showManualTimeModal, setShowManualTimeModal] = useState(false);
    const [manualOperation, setManualOperation] = useState<'ADD' | 'SUBTRACT'>('ADD');
    const [manualHours, setManualHours] = useState('');
    const [manualMinutes, setManualMinutes] = useState('');
    const [manualDescription, setManualDescription] = useState('');

    const handleStopTimer = async () => {
        if (!currentEntryId) return;

        try {
            const { error } = await supabase
                .from('time_logs')
                .update({
                    end_time: new Date().toISOString(),
                    duration_seconds: elapsedTime
                })
                .eq('id', currentEntryId);

            if (error) throw error;

            setIsTracking(false);
            setCurrentEntryId(null);
            setHistoricTime(prev => prev + elapsedTime);
            setElapsedTime(0);
            if (user && task) await logActivity(task.id, user.id, 'TIMER_STOP', 'parou o timer');
        } catch (error: any) {
            console.error('Error stopping timer:', error);
            alert(`Erro ao parar timer: ${error?.message}`);
        }
    };

    const handleSubmitManualTime = async () => {
        if (!manualHours && !manualMinutes) return;
        const h = parseInt(manualHours || '0');
        const m = parseInt(manualMinutes || '0');
        let totalSeconds = (h * 3600) + (m * 60);

        if (totalSeconds <= 0) {
            alert('Por favor, informe um tempo válido.');
            return;
        }

        let finalDescription = manualDescription;

        // Validation for Subtraction
        if (manualOperation === 'SUBTRACT') {
            const currentTotal = historicTime + elapsedTime;
            if (totalSeconds > currentTotal) {
                alert(`Não é possível remover mais tempo do que o registrado (Total: ${formatTime(currentTotal).hours}h ${formatTime(currentTotal).minutes}m).`);
                return;
            }
            totalSeconds = -totalSeconds; // Negative value
            finalDescription = `[AJUSTE NEGATIVO]: ${manualDescription}`;
        }

        try {
            const { error } = await supabase
                .from('time_logs')
                .insert([{
                    task_id: task?.id,
                    user_id: user?.id,
                    start_time: new Date().toISOString(),
                    end_time: new Date().toISOString(),
                    duration_seconds: totalSeconds,
                    is_manual: true,
                    entry_category: 'MANUAL_ADJUSTMENT',
                    description: finalDescription
                }]);

            if (error) throw error;

            // Safe update for historic time, preventing UI negative drift if something weird happens, 
            // though validation above should catch it.
            setHistoricTime(prev => Math.max(0, prev + totalSeconds));

            setShowManualTimeModal(false);
            setManualHours('');
            setManualMinutes('');
            setManualDescription('');
            setManualOperation('ADD'); // Reset default

            const actionText = manualOperation === 'ADD' ? `lançou manualmente` : `pagou/removeu manualmente`;
            if (user && task) await logActivity(task.id, user.id, 'MANUAL_TIME', `${actionText} ${h}h ${m}m`);
            alert('Horas ajustadas com sucesso!');

            // --- AUDIT LOG COMMENT ---
            if (user && task) {
                const actionVerb = manualOperation === 'ADD' ? 'adicionou' : 'removeu';
                const actorName = userProfile?.full_name || user?.email || 'Usuário';
                const auditContent = `[SISTEMA]: **${actorName}** ${actionVerb} manualmente **${h}h ${m}m**. Motivo: *${manualDescription}*`;

                const { data: newAuditComment, error: auditError } = await supabase
                    .from('task_comments')
                    .insert([{
                        task_id: task.id,
                        user_id: user.id,
                        content: auditContent
                    }])
                    .select('*, user:users(full_name, email, avatar_url)')
                    .single();

                if (!auditError && newAuditComment) {
                    setComments(prev => [...prev, newAuditComment]);
                }
            }
            // -------------------------

        } catch (error: any) {
            console.error('Error adding manual time:', error);
            alert(`Erro ao lançar horas: ${error.message}`);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editor) {
            try {
                toast.loading('Otimizando e enviando imagem...');
                const url = await handleCommentImageUpload(file);
                editor.chain().focus().setImage({ src: url }).run();
                toast.dismiss();
                toast.success('Imagem otimizada e anexada!');
            } catch (error: any) {
                toast.dismiss();
                console.error('Erro no handleFileChange:', error);
                toast.error(`Erro ao enviar imagem: ${error.message || 'Erro desconhecido'}`);
            }
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCommentImageUpload = async (file: File): Promise<string> => {
        try {
            console.log('Original File:', file.name, file.size);

            // Compress Image
            const compressedFile = await compressImage(file);
            console.log('Compressed File:', compressedFile.name, compressedFile.size);

            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `comment_images/${fileName}`;

            console.log('Destino do upload:', filePath);

            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(filePath, compressedFile);

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError);
                throw uploadError;
            }

            console.log('Upload concluído, buscando URL pública...');

            const { data: { publicUrl } } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(filePath);

            return publicUrl;

        } catch (error: any) {
            console.error('Erro detalhado no handleCommentImageUpload:', error);
            throw error;
        }
    };


    // --- DRAG AND DROP LOGIC ---
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await handleFileUpload(files);
        }
    };

    const handleFileUpload = async (files: File[]) => {
        if (!task || !user) return;
        setUploading(true);
        const toastId = toast.loading(`Enviando ${files.length} arquivo(s)...`);

        try {
            for (const file of files) {
                // 1. Validate size (max 50MB)
                if (file.size > 50 * 1024 * 1024) {
                    toast.error(`Arquivo ${file.name} muito grande (max 50MB)`);
                    continue;
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${task.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                // 2. Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('task-attachments')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // 3. Insert into Database
                const { error: dbError } = await supabase
                    .from('task_attachments')
                    .insert([{
                        task_id: task.id,
                        user_id: user.id,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: fileName
                    }]);

                if (dbError) throw dbError;

                // Add Activity Log
                await logActivity(task.id, user.id, 'ATTACHMENT_ADD', `anexou o arquivo: ${file.name}`);
            }

            toast.success('Arquivos enviados com sucesso!', { id: toastId });
            fetchAttachments(task.id);

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Erro ao enviar: ${error.message}`, { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!task || !confirm('Tem certeza que deseja excluir este anexo?')) return;

        try {
            const attachment = attachments.find(a => a.id === attachmentId);
            if (!attachment) return;

            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('task-attachments')
                .remove([attachment.path]);

            if (storageError) console.error('Storage delete error (might be okay if db only):', storageError);

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('task_attachments')
                .delete()
                .eq('id', attachmentId);

            if (dbError) throw dbError;

            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            toast.success('Anexo removido.');

        } catch (error) {
            console.error('Delete attachment error:', error);
            toast.error('Erro ao excluir anexo.');
        }
    };



    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return;

        setSubmitting(true);

        try {
            const { data, error } = await supabase
                .from('task_comments')
                .insert([{
                    task_id: task.id,
                    user_id: user?.id,
                    content: newComment,
                    mentions: extractMentionsFromContent(editor?.getJSON())
                }])
                .select(`
                    *,
                    user:users(full_name, email)
                `)
                .single();

            if (error) throw error;

            setComments([...comments, data]);
            setNewComment('');

            // Notification is now handled by database triggers automatically
        } catch (error: any) {
            console.error('Error adding comment:', error);
            alert(`Erro ao adicionar comentário: ${error?.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const extractMentionsFromContent = (json: any): string[] => {
        const mentions: string[] = [];

        const traverse = (node: any) => {
            if (node.type === 'mention' && node.attrs?.id) {
                mentions.push(node.attrs.id);
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach((child: any) => traverse(child));
            }
        };

        if (json) traverse(json);
        // Deduplicate
        return Array.from(new Set(mentions));
    };

    const extractChecklistFromHtml = (htmlContent: string): ChecklistItem[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const tasks = doc.querySelectorAll('ul[data-type="taskList"] li');

        return Array.from(tasks).map((li, index) => {
            // Tiptap stores checked state in data-checked or sometimes just checks the input inside.
            // Standard Tiptap task item structure: <li data-type="taskItem" data-checked="true|false">...</li>
            const isChecked = li.getAttribute('data-checked') === 'true';
            const text = li.textContent?.trim() || '';
            // Use index as ID for now since Tiptap doesn't enforce IDs on list items by default
            return { id: `item-${index}`, text, completed: isChecked };
        });
    };

    const handleToggleChecklistItem = async (itemId: string) => {
        if (!task) return;

        // 1. Optimistic Update
        const updatedItems = checklistItems.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        setChecklistItems(updatedItems);

        // 2. Parse HTML and Update Source of Truth
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(task.description, 'text/html');
            const tasks = doc.querySelectorAll('ul[data-type="taskList"] li');

            const indexStr = itemId.replace('item-', '');
            const index = parseInt(indexStr);

            if (tasks[index]) {
                const currentChecked = tasks[index].getAttribute('data-checked') === 'true';
                tasks[index].setAttribute('data-checked', String(!currentChecked));

                // Also update the input checkbox if it exists inside (Tiptap structure)
                const checkbox = tasks[index].querySelector('input[type="checkbox"]');
                if (checkbox) {
                    if (!currentChecked) {
                        checkbox.setAttribute('checked', 'checked');
                    } else {
                        checkbox.removeAttribute('checked');
                    }
                }

                // Serialize back to HTML
                const newDescription = doc.body.innerHTML;

                // 3. Save to Database
                const { error } = await supabase
                    .from('tasks')
                    .update({ description: newDescription })
                    .eq('id', task.id);

                if (error) throw error;

                // Update local task state silently to ignore re-extraction or prevent conflict
                setTask(prev => prev ? { ...prev, description: newDescription } : null);
            }

        } catch (error) {
            console.error('Error syncing checklist:', error);
            // Revert on error
            setChecklistItems(checklistItems);
            alert('Erro ao sincronizar checklist.');
        }
    };





    const handleCompleteTask = async () => {
        if (!task) return;

        try {
            const updates: any = { status: 'DONE' };

            // Find corresponding column for 'DONE'
            const doneColumn = boardColumns.find(c => c.statuses.includes('DONE'));
            if (doneColumn) {
                updates.column_id = doneColumn.id;
            }

            // "Handover Logic": If creator exists and is different from current assignee, return to creator
            if (task.creator && task.creator.id !== user?.id) {
                updates.assignee_id = task.creator.id;
            }

            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', task.id);

            if (error) throw error;

            // Stop timer if running
            if (isTracking) {
                await handleStopTimer();
            }

            // Optional: Add comment about completion handover
            if (task.creator && task.creator.id !== user?.id) {
                await supabase.from('task_comments').insert([{
                    task_id: task.id,
                    user_id: user?.id,
                    content: `✅ **Tarefa Concluída** devolvida para ${task.creator.full_name} para conferência.`
                }]);
            }

            if (user?.id) {
                if (task.creator && task.creator.id !== user.id) {
                    await logActivity(id!, user.id, 'HANDOVER', 'concluiu e devolveu a tarefa para o criador');
                } else {
                    await logActivity(id!, user.id, 'STATUS_CHANGE', 'marcou a tarefa como concluída');
                }
            }

            alert('✅ Tarefa concluída com sucesso!');
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Error completing task:', error);
            alert(`Erro ao concluir tarefa: ${error?.message}`);
        }
    };

    const handleUpdateStatus = async (newStatus: string, newColumnId: string) => {
        if (!task) return;

        // Ensure we never send 'TODO' unless it's the actual status
        if (!newStatus) {
            toast.error('Status inválido para update');
            return;
        }

        try {
            const updates: any = { status: newStatus };
            if (newColumnId) updates.column_id = newColumnId;
            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', task.id)
                .select(); // Added .select() to verify RLS

            if (error) throw error;



            // Update local state IMMEDIATELY with database response
            if (data && data.length > 0) {
                console.log('UI Refresh - Nova Coluna:', newColumnId);
                setTask(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        ...data[0], // Merge actual database response
                        status: newStatus,
                        column_id: newColumnId
                    };
                });
            } else {
                // Fallback if select() didn't return data
                setTask(prev => {
                    if (!prev) return null;
                    return { ...prev, status: newStatus, column_id: newColumnId };
                });
            }

            setShowStageDropdown(false);

            // Log activity
            if (user && task) await logActivity(task.id, user.id, 'STATUS_CHANGE', `moveu a tarefa para ${newStatus}`);

            // Dispatch event to refresh Kanban board
            // Dispatch event to refresh Kanban board
            window.dispatchEvent(new Event('taskUpdated'));

            toast.success('Status atualizado com sucesso!');

        } catch (error: any) {
            console.error('❌ Error updating status:', error);
            toast.error(`Erro ao atualizar status: ${error.message}`);
        }
    };



    const handleReturnTask = async () => {
        if (!task || !task.creator) {
            alert('Não foi possível identificar o criador da tarefa.');
            return;
        }

        if (!returnReason.trim()) {
            alert('Por favor, informe o motivo da devolução.');
            return;
        }

        if (!confirm(`Deseja devolver esta tarefa para ${task.creator.full_name || 'o criador'}?`)) return;

        try {
            // 1. Add comment with reason
            const { error: commentError } = await supabase
                .from('task_comments')
                .insert([{
                    task_id: task.id,
                    user_id: user?.id,
                    content: `🔄 **Tarefa Devolvida**\n\nMotivo: ${returnReason}`
                }]);

            if (commentError) throw commentError;

            // 2. Update task assignee to creator and status to WAITING_CLIENT (Devolution)
            const { error: taskError } = await supabase
                .from('tasks')
                .update({
                    assignee_id: task.creator.id,
                    status: 'WAITING_CLIENT'
                })
                .eq('id', task.id);

            if (taskError) throw taskError;

            if (user && task) await logActivity(task.id, user.id, 'RETURN_TASK', 'devolveu a tarefa', { reason: returnReason });
            alert(`Tarefa devolvida para ${task.creator.full_name} com sucesso!`);
            navigate('/dashboard');

        } catch (error: any) {
            console.error('Error returning task:', error);
            alert(`Erro ao devolver tarefa: ${error?.message}`);
        }
    };




    const handleCloneTask = async () => {
        if (!task) return;
        setShowCloneModal(true);
    };

    const handleCloneConfirm = async () => {
        if (!task) return;
        setCloning(true);

        try {
            // 1. Prepare Base Data
            const cloneData: any = {
                title: `${task.title} (Cópia)`,
                priority: task.priority,
                created_by: user?.id,
                tags: task.tags
                // updated_at removed to let DB handle defaults and avoid schema cache errors
            };

            // Handle Granular Options
            if (cloneOptions.description) {
                cloneData.description = task.description;
            }

            if (cloneOptions.client) {
                cloneData.client_id = task.client?.id;
            }

            if (cloneOptions.project) {
                cloneData.project_id = task.project?.id;
            }

            if (cloneOptions.flow) {
                cloneData.workflow_id = task.workflow?.id;
                cloneData.status = task.status;
            } else {
                cloneData.status = 'BACKLOG';
            }

            if (cloneOptions.date && task.due_date) {
                cloneData.due_date = task.due_date;
            } else {
                cloneData.due_date = null;
            }

            // Assignees
            if (cloneOptions.assignees && task.assignee?.id) {
                cloneData.assignee_id = task.assignee.id;
            }

            // Attachments (Copy array refs)
            if (cloneOptions.attachments && task.attachments && task.attachments.length > 0) {
                cloneData.attachments = task.attachments.map((att: any) => ({
                    ...att,
                    id: crypto.randomUUID(), // New Meta ID
                    uploaded_at: new Date().toISOString()
                }));
            }

            // 2. Insert New Task
            const { data: newTask, error } = await supabase
                .from('tasks')
                .insert([cloneData])
                .select()
                .single();

            if (error) throw error;
            if (!newTask) throw new Error('Falha ao criar tarefa.');

            // 3. Insert Relations

            // 3a. Boards
            const boardsToLink = task.board_ids || (task.project?.board_id ? [task.project.board_id] : []);
            if (boardsToLink.length > 0) {
                const boardRows = boardsToLink.map((bid: string) => ({
                    task_id: newTask.id,
                    board_id: bid
                }));
                await supabase.from('task_boards').insert(boardRows);
            }

            // 3b. Assignees (Many-to-Many)
            if (cloneOptions.assignees && task.task_assignees && task.task_assignees.length > 0) {
                // Map based on inspected structure: usually ta.user_id if nested from select(..., task_assignees(user_id))
                // or ta.user.id if nested select(..., task_assignees(user:users(id)))
                // TaskDetail uses assignees.map(a => a.user.full_name) so structure is likely { user: { id, ... } }.
                // We need just user_id for insert.
                const realAssigneeRows = task.task_assignees.map((ta: any) => ({
                    task_id: newTask.id,
                    user_id: ta.user?.id || ta.user_id // safe fallback
                })).filter((row: any) => row.user_id);

                if (realAssigneeRows.length > 0) {
                    await supabase.from('task_assignees').insert(realAssigneeRows);
                }
            }

            // 3c. Comments (If selected)
            if (cloneOptions.comments) {
                const { data: originalComments } = await supabase
                    .from('task_comments')
                    .select('*')
                    .eq('task_id', task.id)
                    .order('created_at', { ascending: true });

                if (originalComments && originalComments.length > 0) {
                    const commentRows = originalComments.map(c => ({
                        task_id: newTask.id,
                        user_id: c.user_id,
                        content: c.content,
                        created_at: c.created_at, // Preserve history
                    }));
                    await supabase.from('task_comments').insert(commentRows);
                }
            }

            // 4. System Comment
            await supabase.from('task_comments').insert([{
                task_id: newTask.id,
                user_id: user?.id,
                content: `🔄 **Tarefa Clonada**\n\nEsta tarefa foi originada a partir da tarefa #${task.task_number}.`
            }]);

            toast.success('Tarefa clonada com sucesso!');
            setShowCloneModal(false);

            // 5. Navigate to EDIT (Edit route is /tasks/:task_number/edit based on handleEditTask)
            navigate(`/tasks/${newTask.task_number}/edit`);

        } catch (error: any) {
            console.error('Error cloning task:', error);
            toast.error(`Erro ao clonar: ${error.message}`);
        } finally {
            setCloning(false);
        }
    };





    const handleEditTask = () => {
        if (task) {
            navigate(`/tasks/${task.task_number}/edit`);
        }
    };

    const handleDeleteTask = async () => {
        if (!task || !confirm('Tem certeza que deseja excluir esta tarefa permanentemente? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id);

            if (error) throw error;

            toast.success('Tarefa excluída com sucesso.');
            navigate('/queue');
        } catch (error: any) {
            console.error('Error deleting task:', error);
            toast.error(`Erro ao excluir tarefa: ${error.message}`);
        }
    };



    // Helper for formatting time (re-use existing or ensure it matches design requirements)
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: secs.toString().padStart(2, '0')
        };
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Tarefa Contínua';
        // Fix Timezone Off-by-One Error:
        // Parse date parts manually to avoid browser timezone shift (UTC midnight -> Local previous day)
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = d.toLocaleDateString('pt-BR');
        const todayStr = today.toLocaleDateString('pt-BR');
        const yesterdayStr = yesterday.toLocaleDateString('pt-BR');

        let prefix = '';
        if (dateStr === todayStr) prefix = 'Hoje';
        else if (dateStr === yesterdayStr) prefix = 'Ontem';
        else prefix = dateStr;

        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${prefix}, ${time}`;
    };

    const completedCount = checklistItems.filter(item => item.completed).length;
    const completionPercentage = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;

    // Display total time = Historic + Current Elapsed
    const time = formatTime(historicTime + elapsedTime);

    // Workflow Logic
    // Workflow Logic
    const workflowConfigured = !!task?.workflow?.steps && task.workflow.steps.length > 0;

    // Calculate next column based on Workflow Steps if configured, otherwise fallback to Kanban order (or null if strictly workflow based)
    // User requested strict adherence to workflow settings if available.
    let nextColumn = null;

    if (workflowConfigured && task?.workflow?.steps) {
        // Find current step index in the workflow
        // We match based on column ID if possible, or fallback to Title/Status match
        // task.column_id is the source of truth for location.
        // We assume workflow steps map to columns by NAME.
        const currentColumnTitle = boardColumns.find(c => c.id === task.column_id)?.title;

        if (currentColumnTitle) {
            const currentStepIndex = task.workflow.steps.findIndex((s: any) => s.name.toLowerCase() === currentColumnTitle.toLowerCase());

            if (currentStepIndex !== -1 && currentStepIndex < task.workflow.steps.length - 1) {
                const nextStepName = task.workflow.steps[currentStepIndex + 1].name;
                nextColumn = boardColumns.find(c => c.title.toLowerCase() === nextStepName.toLowerCase());
            }
        }
    } else {
        // Fallback: Logic based simply on visual order of columns in the Board
        const currentColumnIndex = boardColumns.findIndex(c => c.id === task?.column_id);
        nextColumn = currentColumnIndex >= 0 && currentColumnIndex < boardColumns.length - 1 ? boardColumns[currentColumnIndex + 1] : null;
    }

    // Mock attachments for UI demo removed - using real data now


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="text-white animate-pulse">Carregando detalhes da tarefa...</div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="text-white text-lg font-bold">Tarefa não encontrada</div>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary hover:underline">Voltar ao Dashboard</button>
            </div>
        );
    }

    return (
        <div
            className="bg-background-dark text-white font-display antialiased overflow-x-hidden min-h-screen flex flex-col relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-2 border-primary border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none">
                    <div className="bg-background-dark p-6 rounded-xl border border-primary shadow-xl flex flex-col items-center gap-4 animate-in zoom-in duration-200">
                        <span className="material-symbols-outlined text-6xl text-primary animate-bounce">cloud_upload</span>
                        <h3 className="text-xl font-bold text-white">Solte os arquivos para anexar</h3>
                    </div>
                </div>
            )}
            {/* Header */}
            <Header
                title="Detalhes da Tarefa"
            />

            <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    {task.client && (
                        <div className="flex items-center gap-1.5 text-primary transition-colors cursor-default group bg-surface-dark border border-border-dark px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[18px]">domain</span>
                            <span className="font-bold text-sm leading-normal">{task.client.name}</span>
                        </div>
                    )}
                    {task.project && (
                        <>
                            <span className="text-text-muted text-sm font-medium leading-normal">/</span>
                            <a className="text-text-muted hover:text-white transition-colors text-sm font-medium leading-normal cursor-pointer flex items-center gap-1" onClick={() => navigate(`/kanban`)}>
                                <span className="material-symbols-outlined text-[18px]">folder</span>
                                {task.project.name}
                            </a>
                        </>
                    )}
                    <span className="text-text-muted text-sm font-medium leading-normal">/</span>
                    <span className="text-white text-sm font-medium leading-normal">{task.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Task Header Info - Compact */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-text-muted text-xs">
                                    <span className="bg-surface-border px-1.5 py-0.5 rounded font-mono">#{task.task_number}</span>
                                    <span>•</span>
                                    <span>{task.creator?.full_name || 'Sistema'}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">{task.title}</h1>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${task.priority === 'HIGH' ? 'text-[#ff6b6b] bg-[#ff6b6b]/10 border-[#ff6b6b]/20' :
                                            task.priority === 'MEDIUM' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                                                'text-blue-400 bg-blue-400/10 border-blue-400/20'
                                            }`}>
                                            <span className="material-symbols-outlined text-[14px]">priority_high</span>
                                            {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                                        </span>
                                        <span className="flex items-center gap-1 text-text-muted bg-surface-dark px-1.5 py-0.5 rounded border border-border-dark">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {formatDate(task.due_date)}
                                        </span>
                                        {task.workflow && (
                                            <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                                <span className="material-symbols-outlined text-[14px]">view_kanban</span>
                                                {task.workflow.name}
                                            </span>
                                        )}
                                        {task.tags?.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 text-text-muted bg-surface-dark px-1.5 py-0.5 rounded border border-border-dark">
                                                <span className="material-symbols-outlined text-[14px]">tag</span> {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleEditTask}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-dark hover:bg-surface-dark/80 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-border-dark transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Editar
                                    </button>
                                    <button
                                        onClick={handleCloneTask}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-dark hover:bg-surface-dark/80 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-border-dark transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                        Clonar
                                    </button>

                                    {user && (
                                        (userProfile?.role === 'ADMIN') ||
                                        (userProfile?.role === 'MANAGER' && task?.created_by === user.id)
                                    ) && (
                                            <button
                                                onClick={handleDeleteTask}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-500/20 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                Excluir
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section - NEW */}
                        <div className="bg-[#102216] rounded-xl border border-[#23482f] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">attach_file</span>
                                    Arquivos & Anexos
                                </h3>
                                <label className={`cursor-pointer px-3 py-1.5 bg-[#1a3524] hover:bg-[#23482f] border border-[#23482f] rounded-lg text-xs font-bold text-[#92c9a4] transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    {uploading ? 'Enviando...' : 'Adicionar'}
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        disabled={uploading}
                                        onChange={(e) => {
                                            if (e.target.files) handleFileUpload(Array.from(e.target.files));
                                        }}
                                    />
                                </label>
                            </div>

                            {/* Attachments List */}
                            <AttachmentList
                                attachments={attachments}
                                onDelete={handleDeleteAttachment}
                                currentUser={user ? { id: user.id, role: userProfile?.role || 'MEMBER' } : null}
                            />

                            {/* Empty State */}
                            {attachments.length === 0 && (
                                <div className="border-2 border-dashed border-[#23482f] rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">cloud_upload</span>
                                    <p className="text-sm font-medium text-slate-400">Arraste arquivos aqui ou clique em Adicionar</p>
                                    <p className="text-xs text-slate-600 mt-1">Suporta imagens, PDFs, docs...</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 md:p-8">
                            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">description</span>
                                Descrição
                            </h3>
                            <div
                                className="prose prose-invert max-w-none text-gray-300 leading-relaxed font-body whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                    __html: (() => {
                                        const html = task.description || '';
                                        if (!html) return '';
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(html, 'text/html');
                                        doc.querySelectorAll('ul[data-type="taskList"]').forEach(ul => ul.remove());
                                        return doc.body.innerHTML;
                                    })()
                                }}
                            />
                        </div>

                        {/* Checklist */}
                        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">checklist</span>
                                    Checklist de Execução
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-text-muted tabular-nums">{completionPercentage}%</span>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20">{completedCount}/{checklistItems.length} Concluído</span>
                                </div>
                            </div>
                            <div className="relative w-full bg-background-dark rounded-full h-2.5 mb-8 overflow-hidden border border-white/5">
                                <div className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_12px_rgba(19,236,91,0.6)] transition-all duration-500 ease-out" style={{ width: `${completionPercentage}%` }}></div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {checklistItems.map(item => (
                                    <label key={item.id} className={`flex items-start gap-3 p-3.5 rounded-lg transition-all group cursor-pointer ${item.completed
                                        ? 'bg-background-dark/40 border border-transparent opacity-60 hover:opacity-100'
                                        : 'bg-surface-dark border border-border-dark hover:border-primary/60 hover:bg-[#23482f]/30 hover:shadow-md'
                                        }`}>
                                        <div className="relative flex items-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={() => handleToggleChecklistItem(item.id)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-text-muted bg-transparent checked:border-primary checked:bg-primary transition-all"
                                            />
                                            <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none font-bold">check</span>
                                        </div>
                                        <span className={`transition-colors select-none ${item.completed ? 'text-text-muted line-through group-hover:text-gray-400' : 'text-white font-medium group-hover:text-primary'
                                            }`}>
                                            {item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>



                        {/* Comments */}
                        <div id="comments-section" className="bg-surface-dark rounded-xl border border-border-dark p-6 md:p-8 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">chat</span>
                                    Comentários da Tarefa
                                </h3>
                                <span className="text-xs font-medium text-text-muted bg-background-dark px-2 py-1 rounded border border-border-dark">{comments.length} notas</span>
                            </div>

                            <div className="flex justify-center">
                                <button className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1 py-1 px-3 rounded hover:bg-background-dark">
                                    <span className="material-symbols-outlined text-[14px]">history</span>
                                    Carregar comentários anteriores
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">


                                {comments.map(comment => {
                                    const isSystemLog = comment.content.startsWith('[SISTEMA]:');

                                    if (isSystemLog) {
                                        return (
                                            <div key={comment.id} className="flex gap-4 items-start py-2 opacity-80 group hover:opacity-100 transition-opacity">
                                                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                                    <span className="material-symbols-outlined text-[18px] text-gray-400">smart_toy</span>
                                                </div>
                                                <div className="flex-1 pt-1.5 flex flex-col">
                                                    <p className="text-sm text-gray-400 leading-relaxed font-mono">
                                                        {comment.content.replace('[SISTEMA]:', '').trim().replace(/\*\*/g, '')}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">{formatDateTime(comment.created_at)}</span>
                                                        <span className="h-px w-8 bg-gray-800"></span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isMe = comment.user.email === user?.email;
                                    const userAvatar = (comment.user as any).avatar_url;
                                    const userInitials = (comment.user.full_name || comment.user.email).charAt(0).toUpperCase();

                                    return (
                                        <div key={comment.id} className={`flex gap-4 group ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className={`size-10 rounded-full bg-cover bg-center shrink-0 ring-2 transition-all flex items-center justify-center text-sm font-bold overflow-hidden ${isMe ? 'ring-primary/40 group-hover:ring-primary' : 'ring-transparent group-hover:ring-border-dark'
                                                } ${!userAvatar ? 'bg-primary/20 text-primary' : ''}`}
                                                style={userAvatar ? { backgroundImage: `url("${userAvatar}")` } : {}}
                                            >
                                                {!userAvatar && userInitials}
                                            </div>
                                            <div className={`flex-1 flex flex-col gap-2 ${isMe ? 'items-end' : ''}`}>
                                                <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : ''}`}>
                                                    <span className="text-white text-sm font-bold">{isMe ? 'Você' : comment.user.full_name || comment.user.email}</span>
                                                    <span className="text-text-muted text-xs">{formatDateTime(comment.created_at)}</span>
                                                </div>
                                                <div className={`p-3.5 rounded-lg border text-sm leading-relaxed shadow-sm ${isMe
                                                    ? 'bg-[#1c4d32] rounded-tr-none border-primary/20 text-white text-right shadow-md'
                                                    : 'bg-background-dark rounded-tl-none border-border-dark text-gray-300'
                                                    }`}>
                                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: comment.content }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <hr className="border-border-dark" />

                            <div className="flex gap-4">
                                <div className="hidden sm:block size-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0j0lEspGG79bejLev2TcmdFsrfIeiQ9Pv18Ow0OfMD3Rn47uH6P84XFEZ6VCDqOF__vKddpeFF-j2mVGMvwieIwbIY3N68MPSOfr_X5-jLcpynlKbrhJAIHUZ9CqPbwhMPixK1Y_iKyYiHniwZ-3wgg_WLQIZ9f5VnWa7oa590FgR3CFcVWFoXC5N_l9iV16Pl4HYmT3A2cccTgonqY8ccOXMRfNy5r9M5urxD1kXxu6BtWSeAxBYmQmzIkBByKVwV0YtPSzWeZQ")' }}></div>
                                <div className="flex-1">
                                    <div className="relative group">

                                        <div className="h-[200px] bg-[#162a1e] border border-border-dark rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-inner relative">
                                            <SimpleEditor
                                                value={newComment}
                                                onChange={setNewComment}
                                                placeholder="Escreva um comentário, dúvida ou atualização..."
                                                onImageUpload={handleCommentImageUpload}
                                                hideToolbar={true}
                                                onEditorReady={setEditor}
                                            />
                                            {/* Hidden File Input for Attachment Button */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1 relative">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-1.5 text-text-muted hover:text-white hover:bg-surface-dark rounded transition-colors"
                                                    title="Adicionar anexo"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                                </button>
                                                <button
                                                    onClick={() => editor?.chain().focus().insertContent('@').run()}
                                                    className="p-1.5 text-text-muted hover:text-white hover:bg-surface-dark rounded transition-colors"
                                                    title="Mencionar alguém"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                                                </button>

                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                        className="p-1.5 text-text-muted hover:text-white hover:bg-surface-dark rounded transition-colors"
                                                        title="Adicionar emoji"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">add_reaction</span>
                                                    </button>

                                                    {showEmojiPicker && (
                                                        <div className="absolute bottom-full mb-2 left-0 z-50">
                                                            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)}></div>
                                                            <div className="relative z-50 shadow-2xl rounded-lg overflow-hidden">
                                                                <EmojiPicker
                                                                    onEmojiClick={(emojiData) => {
                                                                        if (editor) {
                                                                            editor.chain().focus().insertContent(emojiData.emoji).run();
                                                                        }
                                                                        setShowEmojiPicker(false);
                                                                    }}
                                                                    theme={Theme.DARK}
                                                                    lazyLoadEmojis={true}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleAddComment}
                                                disabled={submitting}
                                                className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-background-dark text-sm font-bold rounded shadow-lg shadow-primary/20 transition-all transform active:scale-95 hover:-translate-y-0.5"
                                            >
                                                {submitting ? 'Enviando...' : 'Enviar'}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-text-muted flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px]">info</span>
                                        Pressione <span className="font-mono bg-background-dark px-1.5 py-0.5 rounded border border-border-dark text-[10px] tracking-wider">CTRL + ENTER</span> para enviar
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
                        {/* Boards (Read-Only) */}
                        <div className="bg-surface-dark rounded-xl border border-border-dark p-4 shadow-lg flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary text-[18px]">dashboard</span>
                                <span className="text-white text-xs font-bold uppercase tracking-wider">Quadros</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedBoardIds.length > 0 ? (
                                    selectedBoardIds.map(boardId => {
                                        const board = boards.find(b => b.id === boardId);
                                        if (!board) return null;
                                        return (
                                            <div key={boardId} className="flex items-center gap-1.5 bg-background-dark border border-border-dark rounded-full pl-2 pr-3 py-1 transition-colors hover:border-primary/50 group cursor-default">
                                                <span className="material-symbols-outlined text-[16px] text-primary">view_kanban</span>
                                                <span className="text-[10px] font-bold text-gray-200 group-hover:text-white transition-colors max-w-[150px] truncate">
                                                    {board.name}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-text-muted text-xs italic flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                                        Nenhum
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assignees */}
                        <div className="bg-surface-dark rounded-xl border border-border-dark p-4 shadow-lg flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                                <span className="text-white text-xs font-bold uppercase tracking-wider">Responsáveis</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {task.task_assignees && task.task_assignees.length > 0 ? (
                                    task.task_assignees.map((assignee) => (
                                        <div key={assignee.user.id} className="flex items-center gap-1.5 bg-background-dark border border-border-dark rounded-full pl-1 pr-2 py-1 transition-colors hover:border-primary/50 group cursor-default">
                                            <div
                                                className="size-5 rounded-full bg-cover bg-center bg-[#2a2a2e] ring-1 ring-white/10 flex items-center justify-center shrink-0"
                                                style={{ backgroundImage: assignee.user.avatar_url ? `url('${assignee.user.avatar_url}')` : undefined }}
                                            >
                                                {!assignee.user.avatar_url && (
                                                    <span className="text-[9px] text-white font-bold">
                                                        {assignee.user.full_name?.charAt(0) || assignee.user.email?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-200 group-hover:text-white transition-colors max-w-[100px] truncate">{assignee.user.full_name || assignee.user.email}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-text-muted text-xs italic flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">person_off</span>
                                        Nenhum
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timer Card */}
                        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 shadow-2xl shadow-black/50 relative overflow-hidden group">
                            {isTracking && <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse"></div>}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-text-muted text-sm font-medium uppercase tracking-wider">Tempo Decorrido</span>
                                {isTracking && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background-dark/50 border border-primary/20">
                                        <div className="size-2 rounded-full bg-primary animate-ping"></div>
                                        <span className="text-primary text-xs font-bold">Gravando</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center items-baseline gap-1 mb-8 font-mono tabular-nums select-none">
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">{time.hours}</span>
                                        {(historicTime + elapsedTime) > 43200 && (
                                            <div className="absolute -top-3 -right-3 md:-right-6 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                                12h+
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-text-muted text-xs mt-1">h</span>
                                </div>
                                <span className="text-5xl md:text-6xl font-black text-primary/50 pb-2">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">{time.minutes}</span>
                                    <span className="text-text-muted text-xs mt-1">m</span>
                                </div>
                                <span className="text-5xl md:text-6xl font-black text-primary/50 pb-2">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl md:text-6xl font-black text-primary tracking-tighter">{time.seconds}</span>
                                    <span className="text-text-muted text-xs mt-1">s</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {!isTracking ? (
                                    <button onClick={handleStartTimer} className="flex-1 h-12 bg-primary hover:bg-primary-dark text-background-dark font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(19,236,91,0.4)] hover:shadow-[0_0_25px_-5px_rgba(19,236,91,0.6)]">
                                        <span className="material-symbols-outlined fill-current">play_arrow</span>
                                        Iniciar
                                    </button>
                                ) : (
                                    <button onClick={handlePauseTimer} className="flex-1 h-12 bg-primary hover:bg-primary-dark text-background-dark font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(19,236,91,0.4)] hover:shadow-[0_0_25px_-5px_rgba(19,236,91,0.6)]">
                                        <span className="material-symbols-outlined fill-current">pause</span>
                                        Pausar
                                    </button>
                                )}
                                {isTracking && (
                                    <button onClick={handleStopTimer} className="h-12 w-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 transition-all">
                                        <span className="material-symbols-outlined">stop</span>
                                    </button>
                                )}
                            </div>

                            {/* Manual Time Entry Button */}
                            <button
                                onClick={() => setShowManualTimeModal(true)}
                                className="w-full mt-3 py-2 text-xs font-bold text-gray-400 hover:text-white border border-transparent hover:border-gray-600 rounded-lg transition-all flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                Lançar Horas Manualmente
                            </button>

                            {/* Manual Time Modal */}
                            {showManualTimeModal && (
                                <div className="absolute inset-0 bg-surface-dark/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 overflow-hidden animate-in fade-in">
                                    <div className="w-full max-w-[300px] flex flex-col items-center">
                                        <h4 className="text-white font-bold mb-4">Lançar Horas Manualmente</h4>

                                        {/* Operation Selector */}
                                        <div className="flex bg-background-dark/50 p-1 rounded-lg mb-4 w-full gap-1">
                                            <button
                                                onClick={() => setManualOperation('ADD')}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${manualOperation === 'ADD'
                                                    ? 'bg-primary text-background-dark shadow-sm'
                                                    : 'text-text-muted hover:text-white'
                                                    }`}
                                            >
                                                Adicionar (+)
                                            </button>
                                            <button
                                                onClick={() => setManualOperation('SUBTRACT')}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${manualOperation === 'SUBTRACT'
                                                    ? 'bg-red-500 text-white shadow-sm'
                                                    : 'text-text-muted hover:text-white'
                                                    }`}
                                            >
                                                Remover (-)
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[10px] text-text-muted">Horas</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={manualHours}
                                                    onChange={(e) => setManualHours(e.target.value)}
                                                    className="w-14 bg-background-dark border border-gray-700 rounded-lg p-1.5 text-center text-white font-mono text-sm"
                                                    placeholder="00"
                                                />
                                            </div>
                                            <span className="text-gray-500 pt-3">:</span>
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[10px] text-text-muted">Minutos</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={manualMinutes}
                                                    onChange={(e) => setManualMinutes(e.target.value)}
                                                    className="w-14 bg-background-dark border border-gray-700 rounded-lg p-1.5 text-center text-white font-mono text-sm"
                                                    placeholder="00"
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full mb-4">
                                            <label className="text-[10px] text-text-muted mb-1 block">Motivo / Descrição</label>
                                            <textarea
                                                value={manualDescription}
                                                onChange={(e) => setManualDescription(e.target.value)}
                                                className="w-full bg-background-dark border border-gray-700 rounded-lg p-2.5 text-white text-xs resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600"
                                                placeholder="Ex: Esqueci de iniciar o timer..."
                                                rows={2}
                                            />
                                        </div>

                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={() => setShowManualTimeModal(false)}
                                                className="flex-1 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSubmitManualTime}
                                                disabled={!manualDescription.trim()}
                                                className={`flex-1 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-lg ${!manualDescription.trim()
                                                    ? 'bg-gray-600 cursor-not-allowed opacity-50 shadow-none text-gray-300'
                                                    : manualOperation === 'ADD'
                                                        ? 'bg-primary text-background-dark hover:bg-primary-dark shadow-[0_0_20px_-5px_rgba(19,236,91,0.3)]'
                                                        : 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_-5px_rgba(220,38,38,0.3)]'
                                                    }`}
                                            >
                                                {manualOperation === 'ADD' ? 'Adicionar Tempo' : 'Remover Tempo'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Workflow Actions */}
                        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 flex flex-col gap-5">
                            <button onClick={handleCompleteTask} className="w-full h-12 bg-primary hover:bg-primary-dark text-background-dark text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_-5px_rgba(19,236,91,0.5)] hover:shadow-[0_0_35px_-5px_rgba(19,236,91,0.7)] group transform active:scale-[0.98]">
                                <span className="material-symbols-outlined text-[24px] fill-current">check_circle</span>
                                Concluir Tarefa
                            </button>

                            <div className="relative py-2">
                                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border-dark"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-surface-dark px-2 text-[10px] text-text-muted uppercase tracking-widest font-bold">ou mover etapa</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Definir Próxima Etapa</label>
                                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 cursor-help" title="Configuração do Kanban">Fluxo Ágil</span>
                                </div>
                                {/* Simplified Dropdown Trigger Structure */}
                                <div className="">
                                    <button
                                        ref={triggerRef}
                                        onClick={() => setShowStageDropdown(!showStageDropdown)}
                                        className="w-full bg-background-dark border border-border-dark text-white text-sm font-medium rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-text-muted transition-colors focus:ring-1 focus:ring-primary focus:border-primary gap-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-text-muted text-[20px]">view_week</span>
                                            <span>
                                                {boardColumns.find(col => String(col.id) === String(task.column_id))?.title || 'Selecione...'}
                                            </span>
                                        </div>
                                        <span className={`material-symbols-outlined text-[20px] text-text-muted transition-transform ${showStageDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    className={`w-full h-12 text-background-dark font-bold rounded-lg flex items-center justify-center gap-2 transition-all group transform active:scale-[0.98] ${workflowConfigured && nextColumn
                                        ? 'bg-primary hover:bg-primary-dark shadow-[0_0_20px_-5px_rgba(19,236,91,0.4)] hover:shadow-[0_0_25px_-5px_rgba(19,236,91,0.6)] cursor-pointer'
                                        : 'bg-primary/40 text-background-dark/80 cursor-not-allowed grayscale'
                                        }`}
                                    title={!workflowConfigured ? "Nenhum fluxo automático configurado pelo criador" : "Mover para próxima etapa"}
                                    disabled={!workflowConfigured || !nextColumn}
                                    onClick={() => {
                                        if (nextColumn) {
                                            const statusToUse = nextColumn.statuses?.[0] || nextColumn.title.toUpperCase().replace(/\s+/g, '_');
                                            handleUpdateStatus(statusToUse, nextColumn.id);
                                        }
                                    }}
                                >
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform fill-current">double_arrow</span>
                                    Continuar no Fluxo
                                </button>
                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
                                    <span className="material-symbols-outlined text-[14px]">auto_mode</span>
                                    <span className="opacity-80">Próxima etapa sugerida:</span>
                                    <span className="text-white font-medium">
                                        {nextColumn ? nextColumn.title : 'Conclusão'}
                                    </span>
                                </div>
                            </div>



                            <div className="relative py-2">
                                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border-dark"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-surface-dark px-2 text-xs text-text-muted">ou</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#ff6b6b] text-[18px]">undo</span>
                                        Devolver Tarefa
                                    </label>
                                </div>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-sm text-white placeholder-text-muted focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] resize-none h-20 transition-all focus:bg-[#ff6b6b]/5 outline-none"
                                    placeholder="Motivo da devolução (obrigatório)..."
                                />
                                <button
                                    onClick={handleReturnTask}
                                    className="w-full py-2.5 bg-[#2a2a2e] hover:bg-[#ff6b6b] hover:text-white text-[#ff6b6b] border border-[#ff6b6b]/30 hover:border-[#ff6b6b] text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined text-[18px]">reply</span>
                                    Devolver ao Criador
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-surface-dark/50 rounded-xl border border-border-dark p-4">
                            <ActivityFeed taskId={task.id} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Global Portals */}
            {showStageDropdown && (
                <Portal>
                    {/* Container with pointer-events-none to let scroll pass through */}
                    <div className="fixed inset-0 z-[100] pointer-events-none">
                        <div
                            className="absolute bg-surface-dark backdrop-blur-md border border-border-dark rounded-xl shadow-2xl pointer-events-auto animate-scale-in flex flex-col max-h-[300px]"
                            style={{
                                top: dropdownPosition.top + 8,
                                left: dropdownPosition.left,
                                width: dropdownPosition.width
                            }}
                        >
                            <div className="p-1 overflow-y-auto stage-dropdown-content custom-scrollbar">
                                {boardColumns.map((column) => (
                                    <button
                                        key={column.id}
                                        onClick={() => {
                                            // Use defined status or fallback to normalized title, but NEVER hardcode 'TODO'
                                            const statusToUse = column.statuses?.[0] || column.title.toUpperCase().replace(/\s+/g, '_');
                                            handleUpdateStatus(statusToUse, column.id);
                                        }}
                                        className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                                    >
                                        <span className={column.countColor?.replace('bg-', 'text-').split(' ')[1] || 'text-white'}>{column.title}</span>
                                        {String(task.column_id) === String(column.id) && <span className="material-symbols-outlined text-primary text-[16px]">check</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Clone Modal */}
            {showCloneModal && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Overlay */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowCloneModal(false)}
                        ></div>

                        {/* Modal Content */}
                        <div className="relative bg-surface-dark border border-border-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                            <div className="p-6">
                                <h3 className="text-white text-lg font-bold mb-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">content_copy</span>
                                    Clonar Tarefa
                                </h3>
                                <p className="text-text-muted text-sm mb-6">Selecione o que deseja copiar para a nova tarefa:</p>

                                <div className="flex flex-col gap-3">
                                    {[
                                        { id: 'description', label: 'Descrição' },
                                        { id: 'client', label: 'Cliente' },
                                        { id: 'project', label: 'Projeto' },
                                        { id: 'flow', label: 'Fluxo/Etapa' },
                                        { id: 'date', label: 'Prazo' },
                                        { id: 'assignees', label: 'Responsáveis' },
                                        { id: 'attachments', label: 'Anexos (Arquivos)' },
                                        { id: 'comments', label: 'Comentários (Histórico)' }
                                    ].map((opt: any) => (
                                        <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-border-dark bg-background-dark/50 cursor-pointer hover:border-primary/50 transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={(cloneOptions as any)[opt.id]}
                                                    disabled={opt.disabled}
                                                    onChange={(e) => setCloneOptions(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-text-muted bg-transparent checked:border-primary checked:bg-primary transition-all disabled:opacity-50"
                                                />
                                                <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none font-bold">check</span>
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${opt.disabled ? 'text-gray-500' : 'text-gray-200 group-hover:text-white'}`}>
                                                {opt.label}
                                            </span>
                                        </label>
                                    ))
                                    }
                                </div>
                            </div>

                            <div className="p-4 bg-background-dark/50 border-t border-border-dark flex gap-3">
                                <button
                                    onClick={() => setShowCloneModal(false)}
                                    className="flex-1 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCloneConfirm}
                                    disabled={cloning}
                                    className="flex-1 py-2.5 text-sm font-bold text-background-dark bg-primary hover:bg-primary-dark rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {cloning ? (
                                        <>
                                            <div className="size-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
                                            Clonando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                            Confirmar Clonagem
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};
