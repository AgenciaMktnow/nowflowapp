import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';

type SearchResult = {
    type: 'task' | 'action';
    id: string;
    taskNumber?: number;
    title: string;
    projectName?: string;
    clientName?: string;
    icon: string;
    action: () => void;
};

export default function SearchBar() {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Click outside to close
    useClickOutside(searchRef, () => setIsOpen(false));

    // Cmd/Ctrl + K to focus search
    useKeyboardShortcut({
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        callback: () => {
            inputRef.current?.focus();
        }
    });

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (value.trim()) {
                performGlobalSearch(value.trim());
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [value]);

    const performGlobalSearch = async (searchTerm: string) => {
        setLoading(true);
        const searchResults: SearchResult[] = [];

        try {
            console.log('🔍 Searching for:', searchTerm);

            // SIMPLIFIED QUERY - Get ALL tasks with joins (client-side filtering is more reliable)
            const { data: allTasks, error } = await supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    task_number,
                    project_id,
                    client_id,
                    project:projects(
                        name,
                        client:clients(name)
                    ),
                    client:clients(name)
                `)
                .limit(200);

            if (error) {
                console.error('❌ Query error:', error);
                throw error;
            }

            console.log('📊 Total tasks in database:', allTasks?.length || 0);

            if (!allTasks || allTasks.length === 0) {
                console.warn('⚠️ No tasks found in database!');
                setResults([]);
                setIsOpen(false);
                setLoading(false);
                return;
            }

            // CLIENT-SIDE FILTERING (more reliable)
            const filteredTasks = allTasks.filter(task => {
                const taskNumber = task.task_number?.toString() || '';
                const title = task.title?.toLowerCase() || '';
                const projectName = (task.project as any)?.name?.toLowerCase() || '';
                const clientName = (task.client as any)?.name?.toLowerCase() || '';
                const projectClientName = (task.project as any)?.client?.name?.toLowerCase() || '';

                const search = searchTerm.toLowerCase();

                // Match by task number
                if (taskNumber.includes(search)) return true;

                // Match by title
                if (title.includes(search)) return true;

                // Match by project name
                if (projectName.includes(search)) return true;

                // Match by client name (direct or through project)
                if (clientName.includes(search)) return true;
                if (projectClientName.includes(search)) return true;

                return false;
            });

            console.log('✅ Filtered tasks:', filteredTasks.length);

            // Sort: exact task_number match first
            const exactMatch = filteredTasks.find(t => t.task_number?.toString() === searchTerm);
            const otherTasks = filteredTasks.filter(t => t.task_number?.toString() !== searchTerm);
            const orderedTasks = exactMatch ? [exactMatch, ...otherTasks] : filteredTasks;

            // Format results: #ID - [Projeto] - Título - CLIENTE
            orderedTasks.forEach(task => {
                const clientName = (task.client as any)?.name || (task.project as any)?.client?.name;
                const projectName = (task.project as any)?.name;

                searchResults.push({
                    type: 'task',
                    id: task.id,
                    taskNumber: task.task_number,
                    title: task.title,
                    projectName,
                    clientName,
                    icon: 'task_alt',
                    action: () => {
                        navigate(`/tasks/${task.task_number}`);
                        setIsOpen(false);
                        setValue('');
                    }
                });
            });

            // Add quick actions
            const quickActions: SearchResult[] = [
                {
                    type: 'action',
                    id: 'new-task',
                    title: 'Nova Tarefa',
                    icon: 'add_task',
                    action: () => {
                        navigate('/tasks/new');
                        setIsOpen(false);
                        setValue('');
                    }
                },
                {
                    type: 'action',
                    id: 'my-queue',
                    title: 'Minha Fila',
                    icon: 'list',
                    action: () => {
                        navigate('/queue');
                        setIsOpen(false);
                        setValue('');
                    }
                },
                {
                    type: 'action',
                    id: 'dashboard',
                    title: 'Dashboard',
                    icon: 'dashboard',
                    action: () => {
                        navigate('/dashboard');
                        setIsOpen(false);
                        setValue('');
                    }
                }
            ];

            console.log('🎯 Quick Actions:', quickActions.length);
            console.log('🎯 Search Results (tasks):', searchResults.length);

            const finalResults = [...quickActions, ...searchResults];

            setResults(finalResults);
            setIsOpen(true);

            console.log('✅ Search complete with', finalResults.length, 'total results');
        } catch (error) {
            console.error('❌ Global search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group results by type
    const groupedResults = {
        actions: results.filter(r => r.type === 'action'),
        tasks: results.filter(r => r.type === 'task')
    };

    // Detect platform for keyboard shortcut hint
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

    return (
        <div className="relative hidden md:block" ref={searchRef}>
            <div className={`flex w-80 h-10 items-center bg-surface-highlight rounded-xl px-4 transition-all border ${isOpen ? 'ring-2 ring-primary/50 border-primary/50' : 'border-transparent focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50'
                }`}>
                <span className="material-symbols-outlined text-text-secondary text-[20px]">search</span>
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => value.trim() && performGlobalSearch(value.trim())}
                    className="w-full bg-transparent border-none text-white placeholder-text-secondary focus:ring-0 ml-2 text-sm h-full focus:outline-none"
                    placeholder={`Buscar... (${shortcutHint})`}
                    type="text"
                />
                {loading && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                )}
            </div>

            {/* Global Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-[600px] bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-[100] max-h-[500px] overflow-y-auto custom-scrollbar animate-scale-in">
                    {/* Quick Actions Section */}
                    {groupedResults.actions.length > 0 && (
                        <div className="p-2 border-b border-white/5">
                            <div className="flex items-center gap-2 px-3 py-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ações Rápidas</p>
                            </div>
                            {groupedResults.actions.map(result => (
                                <button
                                    key={result.id}
                                    onClick={result.action}
                                    className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined text-primary text-[18px]">{result.icon}</span>
                                    <span className="font-medium">{result.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tasks Section - Format: #ID - [Projeto] - Título - CLIENTE */}
                    {groupedResults.tasks.length > 0 && (
                        <div className="p-2">
                            <div className="flex items-center gap-2 px-3 py-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">task_alt</span>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                    Tarefas Encontradas ({groupedResults.tasks.length})
                                </p>
                            </div>
                            {groupedResults.tasks.map(result => (
                                <button
                                    key={result.id}
                                    onClick={result.action}
                                    className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* #ID */}
                                        <span className="font-mono font-bold text-primary">#{result.taskNumber}</span>

                                        <span className="text-text-muted">-</span>

                                        {/* [Projeto] */}
                                        {result.projectName ? (
                                            <span className="text-purple-400 font-medium">[{result.projectName}]</span>
                                        ) : (
                                            <span className="text-text-muted italic">[Sem projeto]</span>
                                        )}

                                        <span className="text-text-muted">-</span>

                                        {/* Título */}
                                        <span className="font-medium flex-1 min-w-0 truncate">{result.title}</span>

                                        {/* CLIENTE */}
                                        {result.clientName && (
                                            <>
                                                <span className="text-text-muted">-</span>
                                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-md font-bold uppercase shrink-0">
                                                    {result.clientName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {groupedResults.tasks.length === 0 && groupedResults.actions.length === 0 && (
                        <div className="p-6 text-center text-text-secondary">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                            <p className="text-sm">Nenhuma tarefa encontrada</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
