import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';

interface SearchBarProps {
    onSearch: (value: string) => void;
    placeholder?: string;
    initialValue?: string;
}

type SearchResult = {
    type: 'task' | 'project' | 'action';
    id: string;
    title: string;
    subtitle?: string;
    clientName?: string;
    taskNumber?: number;
    icon: string;
    action: () => void;
};

export default function SearchBar({ onSearch, placeholder = 'Buscar...', initialValue = '' }: SearchBarProps) {
    const [value, setValue] = useState(initialValue);
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
            setIsOpen(true);
        }
    });

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(value);
            if (value.trim()) {
                performSearch(value);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [value, onSearch]);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        const searchResults: SearchResult[] = [];

        try {
            // Check if search is purely numeric (for task number priority)
            const isNumeric = /^\d+$/.test(searchTerm.trim());

            // Search tasks with client and project info
            const { data: tasks } = await supabase
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
                .or(`title.ilike.%${searchTerm}%,task_number.eq.${isNumeric ? searchTerm : '-1'}`)
                .limit(10);

            // Search projects with client info
            const { data: projects } = await supabase
                .from('projects')
                .select(`
                    id,
                    name,
                    client:clients(name)
                `)
                .ilike('name', `%${searchTerm}%`)
                .limit(5);

            // Search clients
            const { data: clients } = await supabase
                .from('clients')
                .select('id, name')
                .ilike('name', `%${searchTerm}%`)
                .limit(5);

            // Process tasks
            if (tasks) {
                // Prioritize exact task number match
                const exactMatch = tasks.find(t => t.task_number?.toString() === searchTerm);
                const otherTasks = tasks.filter(t => t.task_number?.toString() !== searchTerm);
                const orderedTasks = exactMatch ? [exactMatch, ...otherTasks] : tasks;

                orderedTasks.forEach(task => {
                    const clientName = (task.client as any)?.name || (task.project as any)?.client?.name;
                    searchResults.push({
                        type: 'task',
                        id: task.id,
                        title: `#${task.task_number} ${task.title}`,
                        subtitle: (task.project as any)?.name,
                        clientName,
                        taskNumber: task.task_number,
                        icon: 'task_alt',
                        action: () => {
                            navigate(`/tasks/${task.task_number}`);
                            setIsOpen(false);
                            setValue('');
                        }
                    });
                });
            }

            // Process projects
            if (projects) {
                projects.forEach(project => {
                    searchResults.push({
                        type: 'project',
                        id: project.id,
                        title: project.name,
                        clientName: (project.client as any)?.name,
                        icon: 'folder',
                        action: () => {
                            // Navigate to project view or filter dashboard by project
                            navigate(`/dashboard?project=${project.id}`);
                            setIsOpen(false);
                            setValue('');
                        }
                    });
                });
            }

            // Process clients - show tasks for this client
            if (clients) {
                clients.forEach(client => {
                    searchResults.push({
                        type: 'project',
                        id: client.id,
                        title: `Ver tarefas de ${client.name}`,
                        clientName: client.name,
                        icon: 'business',
                        action: () => {
                            navigate(`/dashboard?client=${client.id}`);
                            setIsOpen(false);
                            setValue('');
                        }
                    });
                });
            }

            // Add quick actions if no specific search
            if (searchTerm.length < 3) {
                searchResults.push(
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
                    }
                );
            }

            setResults(searchResults);
            setIsOpen(searchResults.length > 0);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group results by type
    const groupedResults = {
        tasks: results.filter(r => r.type === 'task'),
        projects: results.filter(r => r.type === 'project'),
        actions: results.filter(r => r.type === 'action')
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
                    onFocus={() => value.trim() && setIsOpen(true)}
                    className="w-full bg-transparent border-none text-white placeholder-text-secondary focus:ring-0 ml-2 text-sm h-full focus:outline-none"
                    placeholder={`${placeholder} (${shortcutHint})`}
                    type="text"
                />
                {loading && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-[600px] bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-scale-in max-h-[500px] overflow-y-auto custom-scrollbar">
                    {/* Tasks Section */}
                    {groupedResults.tasks.length > 0 && (
                        <div className="p-2 border-b border-white/5">
                            <div className="flex items-center gap-2 px-3 py-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">task_alt</span>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tarefas</p>
                            </div>
                            {groupedResults.tasks.map(result => (
                                <button
                                    key={result.id}
                                    onClick={result.action}
                                    className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{result.title}</span>
                                            {result.clientName && (
                                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-md font-medium shrink-0">
                                                    {result.clientName}
                                                </span>
                                            )}
                                        </div>
                                        {result.subtitle && (
                                            <span className="text-xs text-text-secondary truncate">{result.subtitle}</span>
                                        )}
                                    </div>
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[18px] ml-2">arrow_forward</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Projects Section */}
                    {groupedResults.projects.length > 0 && (
                        <div className="p-2 border-b border-white/5">
                            <div className="flex items-center gap-2 px-3 py-2">
                                <span className="material-symbols-outlined text-purple-400 text-[18px]">folder</span>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Projetos & Clientes</p>
                            </div>
                            {groupedResults.projects.map(result => (
                                <button
                                    key={result.id}
                                    onClick={result.action}
                                    className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="material-symbols-outlined text-[18px]">{result.icon}</span>
                                        <span className="font-medium truncate">{result.title}</span>
                                        {result.clientName && (
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-md font-medium shrink-0">
                                                {result.clientName}
                                            </span>
                                        )}
                                    </div>
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[18px]">arrow_forward</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions Section */}
                    {groupedResults.actions.length > 0 && (
                        <div className="p-2">
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
                </div>
            )}
        </div>
    );
}
