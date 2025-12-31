import { useState, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../lib/supabase';
import SelectDropdown from '../components/SelectDropdown';
import { extractChecklistFromHtml } from '../utils/checklist';
import { useNavigate, Link } from 'react-router-dom';
import { taskService } from '../services/task.service';
import { boardService } from '../services/board.service';

console.log('Calendário Renderizado com Sucesso v3');

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: any;
    priority: string;
}

export default function TaskCalendar() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const hoverTimeoutRef = useRef<any>(null);

    // Controlled Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<any>(Views.MONTH);

    // FiltersState
    const [clients, setClients] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [boards, setBoards] = useState<any[]>([]);

    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedBoardId, setSelectedBoardId] = useState('');

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [selectedClientId, selectedUserId, selectedBoardId, clients.length]);

    // Cascade Logic
    useEffect(() => {
        if (selectedBoardId) {
            setSelectedClientId('');
            setSelectedUserId('');
        }
    }, [selectedBoardId]);

    const fetchFilters = async () => {
        const { data: clientsData } = await supabase.from('clients').select('id, name, color').order('name');
        if (clientsData) setClients(clientsData);

        const { data: usersData } = await supabase.from('users').select('id, full_name').order('full_name');
        if (usersData) setUsers(usersData);

        const { data: boardsData } = await boardService.getBoards();
        if (boardsData) setBoards(boardsData);
    };

    const fetchTasks = async () => {
        setLoading(true);

        try {
            const { data, error } = await taskService.getTasks({
                clientId: selectedClientId || undefined,
                assigneeId: selectedUserId || undefined,
                boardId: selectedBoardId || undefined
            });

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            if (!data) {
                setEvents([]);
                setLoading(false);
                return;
            }

            const calendarEvents: Event[] = data
                .filter((task: any) => task.due_date) // Filter out tasks without due date
                .map((task: any) => {
                    const parseDate = (dateStr: string) => {
                        if (!dateStr) return new Date();
                        const justDate = dateStr.split('T')[0];
                        const [y, m, d] = justDate.split('-').map(Number);
                        return new Date(y, m - 1, d, 12, 0, 0); // Noon
                    };

                    const dueDate = parseDate(task.due_date);
                    let start = task.start_date ? parseDate(task.start_date) : dueDate;
                    // If start is after due (invalid), or same, or no start_date, treat as single day
                    const isContinuous = start.toDateString() !== dueDate.toDateString();

                    // Parse Checklist (Now returns stats directly)
                    const checklistStats = extractChecklistFromHtml(task.description);

                    // Client Data (Robust Fallback)
                    // Hierarchy: Task Client > Project Client (Joined) > Lookup
                    // Note: taskService now performs deep joins
                    const robustClient = (task as any).client || (task.project as any)?.client || (task.project?.client_id ? clients.find(c => c.id === task.project?.client_id) : null);

                    return {
                        id: task.id,
                        title: task.title,
                        start: start,
                        end: dueDate,
                        allDay: true,
                        priority: task.priority,
                        resource: {
                            ...task,
                            isContinuous,
                            checklist_stats: checklistStats, // Use stats directly
                            client: robustClient
                        }
                    };
                });

            setEvents(calendarEvents);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const eventPropGetter = (event: Event) => {
        let backgroundColor = '#3B82F6';
        if (event.priority === 'HIGH') backgroundColor = '#EF4444';
        if (event.priority === 'MEDIUM') backgroundColor = '#F59E0B';
        if (event.priority === 'LOW') backgroundColor = '#10B981';

        const isContinuous = event.resource.isContinuous;

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                padding: '4px 8px',
                opacity: isContinuous ? 0.6 : 1,
                marginBottom: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer' // Force cursor pointer
            }
        };
    };



    // Hover State for robust Modal visibility
    const [hoveredTask, setHoveredTask] = useState<{ event: any; position: { x: number; y: number } } | null>(null);

    // Custom Event Component for Tooltip/Popover
    const CustomEvent = ({ event }: any) => {
        const resource = event.resource;
        const clientColor = resource.client?.color || '#3B82F6';
        const taskUrl = `/tasks/${resource.task_number}`;

        return (
            <Link
                to={taskUrl}
                className="group relative w-full h-full flex items-center overflow-hidden pl-1 cursor-pointer block hover:overflow-visible"
                onMouseEnter={(e) => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredTask({
                        event: event,
                        position: {
                            x: rect.left + (rect.width / 2),
                            y: rect.top
                        }
                    });
                }}
                onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredTask(null);
                    }, 300); // 300ms delay to allow moving to popover
                }}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {/* Tiny status indicator strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md`} style={{ backgroundColor: clientColor }}></div>
                <span className="truncate text-xs font-semibold ml-1">{event.title} <span className="opacity-70">#{resource.task_number}</span></span>
            </Link>
        );
    };

    // Render Global Popover
    const renderHoverModal = () => {
        if (!hoveredTask) return null;

        const { event, position } = hoveredTask;
        const resource = event.resource;
        const stats = extractChecklistFromHtml(resource.description || '');
        const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const clientColor = resource.client?.color || '#3B82F6';
        const clientName = resource.client?.name || 'Sem Cliente';
        const taskUrl = `/tasks/${resource.task_number}`;

        // Calculate Position Style (Centered above the event)
        const style: React.CSSProperties = {
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%) translateY(-10px)',
            zIndex: 99999, // Extreme Z-Index 
            // User asked for "Click functionality" inside modal too.
            // But if it follows mouse or is static, hovering it is tricky if there's a gap.
            // Let's add a small buffer or make it interactive?
            // For now, let's keep it simple: The CARD itself is the link. 
            // The modal is informative. 
        };

        return (
            <div
                className="w-72 bg-[#193322] border border-[#00FF00] p-4 rounded-xl shadow-2xl animate-fade-in pointer-events-auto"
                style={style}
                onMouseEnter={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                }}
                onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredTask(null);
                    }, 300);
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-3 border-b border-[#00FF00]/30 pb-2">
                    <h4 className="font-bold text-white text-sm leading-tight flex-1 mr-2">{event.title}</h4>
                    <span className="text-[#00FF00] font-mono text-xs">#{resource.task_number}</span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Cliente:</span>
                        {resource.client ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black bg-white" style={{ backgroundColor: clientColor, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                {clientName}
                            </span>
                        ) : <span className="text-gray-600 italic">N/A</span>}
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Prioridade:</span>
                        <span className={`uppercase font-bold ${event.priority === 'HIGH' ? 'text-red-400' : event.priority === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {event.priority === 'HIGH' ? 'Alta' : event.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Prazo:</span>
                        <span className="text-white font-mono">{format(event.end, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                    </div>

                    {/* Checklist */}
                    {stats.total > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500 font-medium">Checklist:</span>
                                <span className="text-white">{stats.completed}/{stats.total} ({progress}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00FF00] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-2">
                    <button
                        className="w-full py-1.5 bg-[#00FF00]/10 hover:bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(taskUrl);
                        }}
                    >
                        Ir para Tarefa
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                </div>

                {/* Arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#193322] border-b border-r border-[#00FF00] rotate-45"></div>
            </div>
        );
    };

    const handleSelectEvent = (event: Event) => {
        // Robust navigation handler
        if (event.resource?.task_number) {
            navigate(`/tasks/${event.resource.task_number}`);
        }
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const handleViewChange = (newView: any) => {
        setCurrentView(newView);
    };

    // Custom Toolbar Component
    const CustomToolbar = (toolbar: any) => {
        const goToBack = () => { toolbar.onNavigate('PREV'); };
        const goToNext = () => { toolbar.onNavigate('NEXT'); };
        const goToCurrent = () => { toolbar.onNavigate('DATE', new Date()); };

        const viewOptions = [
            { label: 'Mês', value: Views.MONTH },
            { label: 'Semana', value: Views.WEEK },
            { label: 'Agenda', value: Views.AGENDA }
        ];

        // Dynamic Title Logic
        const getLabel = () => {
            const date = toolbar.date;
            if (currentView === Views.MONTH) {
                return format(date, 'MMMM yyyy', { locale: ptBR });
            }
            if (currentView === Views.WEEK) {
                const start = startOfWeek(date, { locale: ptBR });
                const end = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales }).endOf(date, 'week' as any);

                // Format: 25 Dez - 31 Dez 2025 (or intelligent regarding years)
                if (start.getFullYear() === end.getFullYear()) {
                    return `${format(start, 'dd MMM', { locale: ptBR })} – ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
                }
                return `${format(start, 'dd MMM yyyy', { locale: ptBR })} – ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
            }
            return format(date, 'PPP', { locale: ptBR }); // Day/Agenda default
        };

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-surface-dark rounded-xl border border-[#326744]/30 shadow-sm relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF00]/20 to-transparent"></div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    {/* Left Arrow */}
                    <button
                        onClick={goToBack}
                        className="p-2 rounded-lg bg-[#112217] border border-[#326744] hover:border-[#00FF00]/50 hover:text-[#00FF00] text-gray-400 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                    </button>

                    {/* Today Button */}
                    <button
                        onClick={goToCurrent}
                        className="px-4 py-2 bg-[#112217] border border-[#326744] rounded-lg text-sm font-bold text-gray-300 hover:text-white hover:border-[#00FF00]/50 hover:bg-[#00FF00]/10 transition-all uppercase tracking-wider"
                    >
                        Hoje
                    </button>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white capitalize min-w-[200px] text-center drop-shadow-sm truncate">
                        {getLabel()}
                    </h2>

                    {/* Right Arrow */}
                    <button
                        onClick={goToNext}
                        className="p-2 rounded-lg bg-[#112217] border border-[#326744] hover:border-[#00FF00]/50 hover:text-[#00FF00] text-gray-400 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SelectDropdown
                        options={viewOptions}
                        value={currentView}
                        onChange={(val) => handleViewChange(val)}
                        placeholder="Visualização"
                        icon="view_agenda"
                        className="min-w-[140px] w-full"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background-dark min-h-screen text-gray-100 animate-fade-in">
            <style>{`
                /* Dark Theme Overrides for React Big Calendar */
                .rbc-calendar {
                    background-color: #193322; /* surface-dark */
                    border-radius: 12px;
                    color: #d1d5db;
                }
                .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
                    border: 1px solid #326744;
                    background-color: #193322;
                }
                .rbc-header {
                    background-color: #112217;
                    color: #9ca3af;
                    padding: 12px 0;
                    border-bottom: 1px solid #326744 !important;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .rbc-day-bg {
                    border-left: 1px solid #326744 !important;
                }
                .rbc-month-row {
                    border-top: 1px solid #326744 !important;
                }
                .rbc-off-range-bg {
                    background-color: #112217 !important; /* Darker for off-range */
                }
                .rbc-today {
                    background-color: rgba(19, 236, 91, 0.05) !important; /* Primary tint */
                }
                .rbc-date-cell {
                    padding: 8px;
                    font-weight: 500;
                    color: #9ca3af;
                }
                .rbc-now .rbc-button-link {
                    color: #13ec5b !important; /* Primary color for today number */
                    font-weight: bold;
                }
                .rbc-event {
                    background-color: transparent;
                }
                .rbc-row-segment {
                    padding: 2px 4px;
                    overflow: visible !important; /* Allow popover to spill out */
                }
                .rbc-event {
                    overflow: visible !important; /* Allow popover to spill out */
                }
                .rbc-month-row {
                    overflow: visible !important; /* Allow popover to spill out */
                }
                
                /* DATA-INK RATIO: Hide Time Grid to focus on Stacked Tasks */
                .rbc-time-view .rbc-time-content {
                    display: none !important;
                }
                .rbc-time-view .rbc-time-header {
                    height: 100%;
                }
                .rbc-time-view .rbc-time-header-content {
                    border-left: 1px solid #326744;
                }
                .rbc-time-header-content > .rbc-row.rbc-row-resource {    
                     border-bottom: none !important;
                }
                .rbc-allday-cell {
                    height: auto !important;
                    max-height: none !important;
                    min-height: 600px; /* Fill space */
                }
            `}</style>

            {/* Header / Filters */}
            <div className="p-6 border-b border-gray-800 bg-surface-dark shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    Calendário de Tarefas
                </h1>

                <div className="flex gap-4 w-full md:w-auto overflow-visible pb-1">
                    <SelectDropdown
                        options={[{ label: 'Todos os Quadros', value: '' }, ...boards.map(b => ({ label: b.name, value: b.id }))]}
                        value={selectedBoardId}
                        onChange={setSelectedBoardId}
                        placeholder="Quadro"
                        icon="dashboard"
                        className="min-w-[160px]"
                    />
                    <SelectDropdown
                        options={[{ label: 'Todos os Clientes', value: '' }, ...clients.map(c => ({ label: c.name, value: c.id }))]}
                        value={selectedClientId}
                        onChange={setSelectedClientId}
                        placeholder="Cliente"
                        icon="domain"
                        className="min-w-[160px]"
                    />
                    <SelectDropdown
                        options={[{ label: 'Todos os Colaboradores', value: '' }, ...users.map(u => ({ label: u.full_name, value: u.id }))]}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        placeholder="Colaborador"
                        icon="group"
                        className="min-w-[160px]"
                    />
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-6 overflow-hidden relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-surface-dark rounded-xl border border-gray-800 shadow-xl h-[800px] p-4 text-gray-300 overflow-x-auto">
                            <div className="min-w-[700px] h-full">
                                <Calendar
                                    localizer={localizer}
                                    events={events} // Pass events
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    culture="pt-BR"
                                    messages={{
                                        next: "Próximo",
                                        previous: "Anterior",
                                        today: "Hoje",
                                        month: "Mês",
                                        week: "Semana",
                                        day: "Dia",
                                        agenda: "Agenda",
                                        date: "Data",
                                        time: "Hora",
                                        event: "Evento",
                                        noEventsInRange: "Sem tarefas neste período."
                                    }}
                                    eventPropGetter={eventPropGetter}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent // Use custom event renderer
                                    }}
                                    onSelectEvent={handleSelectEvent}

                                    // Controlled Props - View Switched
                                    date={currentDate}
                                    view={currentView}
                                    onView={handleViewChange} // Allow view change
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        </div>
                        {/* Render Global Popover Portal */}
                        {renderHoverModal()}
                    </>
                )}
            </div>
        </div>
    );
};
