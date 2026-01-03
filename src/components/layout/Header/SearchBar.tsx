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

            // Check if search is numeric
            const isNumeric = /^\d+$/.test(searchTerm);

            // Build query for tasks with project and client info
            let query = supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    task_number,
                    project:projects(
                        name,
                        client:clients(name)
                    ),
                    client:clients(name)
                `);

            // Search by task_number if numeric, otherwise by title
            if (isNumeric) {
                query = query.eq('task_number', parseInt(searchTerm));
            } else {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            const { data: tasksByTitle, error: titleError } = await query.limit(20);

            if (titleError) {
                console.error('Search error:', titleError);
            }

            console.log('📊 Tasks found by title/number:', tasksByTitle?.length || 0);

            // Also search by project name
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name')
                .ilike('name', `%${searchTerm}%`)
                .limit(10);

            let tasksByProject: any[] = [];
            if (projects && projects.length > 0) {
                const projectIds = projects.map(p => p.id);
                const { data } = await supabase
                    .from('tasks')
                    .select(`
                        id,
                        title,
                        task_number,
                        project:projects(
                            name,
                            client:clients(name)
                        ),
                        client:clients(name)
                    `)
                    .in('project_id', projectIds)
                    .limit(20);

                tasksByProject = data || [];
                console.log('📊 Tasks found by project:', tasksByProject.length);
            }

            // Search by client name
            const { data: clients } = await supabase
                .from('clients')
                .select('id, name')
                .ilike('name', `%${searchTerm}%`)
                .limit(10);

            let tasksByClient: any[] = [];
            if (clients && clients.length > 0) {
                const clientIds = clients.map(c => c.id);

                // Get projects for these clients
                const { data: clientProjects } = await supabase
                    .from('projects')
                    .select('id')
                    .in('client_id', clientIds);

                if (clientProjects && clientProjects.length > 0) {
                    const projectIds = clientProjects.map(p => p.id);
                    const { data } = await supabase
                        .from('tasks')
                        .select(`
                            id,
                            title,
                            task_number,
                            project:projects(
                                name,
                                client:clients(name)
                            ),
                            client:clients(name)
                        `)
                        .in('project_id', projectIds)
                        .limit(20);

                    tasksByClient = data || [];
                    console.log('📊 Tasks found by client:', tasksByClient.length);
                }

                // Also check tasks with direct client_id
                const { data: directClientTasks } = await supabase
                    .from('tasks')
                    .select(`
                        id,
                        title,
                        task_number,
                        project:projects(
                            name,
                            client:clients(name)
                        ),
                        client:clients(name)
                    `)
                    .in('client_id', clientIds)
                    .limit(20);

                if (directClientTasks) {
                    tasksByClient = [...tasksByClient, ...directClientTasks];
                }
            }

            // Combine and deduplicate
            const allTasks = [
                ...(tasksByTitle || []),
                ...tasksByProject,
                ...tasksByClient
            ];

            const uniqueTasks = Array.from(
                new Map(allTasks.map(t => [t.id, t])).values()
            );

            console.log('✅ Total unique tasks found:', uniqueTasks.length);

            // Sort: exact task_number match first
            const exactMatch = uniqueTasks.find(t => t.task_number?.toString() === searchTerm);
            const otherTasks = uniqueTasks.filter(t => t.task_number?.toString() !== searchTerm);
            const orderedTasks = exactMatch ? [exactMatch, ...otherTasks] : uniqueTasks;

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

            // Add quick actions at the beginning
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
            console.log('🎯 Total Results:', quickActions.length + searchResults.length);

            const finalResults = [...quickActions, ...searchResults];
            console.log('🎯 Setting results:', finalResults);

            setResults(finalResults);
            setIsOpen(true);

            console.log('✅ Search complete. Dropdown should be open.');
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

    console.log('📋 Grouped Results - Actions:', groupedResults.actions.length, 'Tasks:', groupedResults.tasks.length);

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
                <div className="absolute top-full left-0 mt-2 w-[600px] bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-scale-in max-h-[500px] overflow-y-auto custom-scrollbar">
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
                            <p className="text-sm">Nenhum resultado encontrado</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
