import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { reportService } from '../../services/report.service';
import WorkHeatmap from './WorkHeatmap';
import CategoryBottleneckChart from './CategoryBottleneckChart';
import ModernDropdown from '../ModernDropdown';
import DateRangePicker from '../DateRangePicker';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TeamOption {
    id: string;
    name: string;
}

interface TeamReportProps {
    users: { id: string, full_name: string, team_ids?: string[] }[];
    teams: TeamOption[];
    filterTeam?: string;
    filterClient?: string;
}

export default function TeamReport({ users, teams, filterTeam: initialFilterTeam, filterClient }: TeamReportProps) {
    const [loading, setLoading] = useState(true);
    const [hierarchy, setHierarchy] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters Data
    const [clients, setClients] = useState<TeamOption[]>([]);

    // Active Filters
    const [selectedTeamId, setSelectedTeamId] = useState<string>(initialFilterTeam || '');
    const [selectedClientId, setSelectedClientId] = useState<string>(filterClient || '');
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    // Sync Props to State
    useEffect(() => {
        if (initialFilterTeam !== undefined) setSelectedTeamId(initialFilterTeam);
    }, [initialFilterTeam]);

    useEffect(() => {
        if (filterClient !== undefined) setSelectedClientId(filterClient);
    }, [filterClient]);

    // Export State
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Date Logic Helper
    const getInitialDate = (param: string, isEnd = false) => {
        const paramDate = searchParams.get(param);
        if (paramDate) return new Date(paramDate);
        const d = new Date();
        if (!isEnd) d.setDate(d.getDate() - 7);
        return d;
    };

    const [startDate, setStartDate] = useState<Date>(getInitialDate('start'));
    const [endDate, setEndDate] = useState<Date>(getInitialDate('end', true));

    const [showInsights, setShowInsights] = useState(false);

    // Helpers
    const teamOptions = [{ id: '', name: 'Todas as Equipes' }, ...teams.map(t => ({ id: t.id, name: t.name }))];

    // Filter Users based on Selected Team
    const filteredUsers = selectedTeamId
        ? users.filter(u => u.team_ids?.includes(selectedTeamId))
        : users;

    const userOptions = [{ id: '', name: 'Todos os Usuários' }, ...filteredUsers.map(u => ({ id: u.id, name: u.full_name }))];
    const clientOptions = [{ id: '', name: 'Todos os Clientes' }, ...clients];

    // Sync URL
    useEffect(() => {
        const params: any = {};
        if (startDate) params.start = startDate.toISOString();
        if (endDate) params.end = endDate.toISOString();
        setSearchParams(prev => ({ ...Object.fromEntries(prev), ...params }));
    }, [startDate, endDate, setSearchParams]);

    // Fetch Clients
    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('clients').select('id, name').order('name');
            if (data) setClients(data);
        };
        fetchClients();
    }, []);

    // Fetch Report Data
    useEffect(() => {
        loadReport();
    }, [selectedTeamId, selectedClientId, selectedUserId, startDate, endDate]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);   // Start of day

            const data = await reportService.getAdvancedReport({
                startDate: start,
                endDate: end,
                teamId: selectedTeamId || undefined,
                clientId: selectedClientId || undefined,
                userId: selectedUserId || undefined
            });

            setHierarchy(data.hierarchy || []);
            setTimeline(data.timeline || []);
            setCategories(data.categories || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Use totalSeconds if available for precision, fall back to hours * 3600
    const formatHours = (val: number, isSeconds = false) => {
        const totalSeconds = isSeconds ? val : val * 3600;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);

        // Use HHh MMm format as requested for clarity
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    };

    // Export Logic
    const handleExportCSV = () => {
        const rows = [['Colaborador', 'Cliente', 'Tarefa', 'Tempo Total (h)', 'Auditoria (Motivo)', 'Auditoria (Tempo Manual)']];

        hierarchy.forEach(user => {
            user.clients.forEach((client: any) => {
                client.tasks.forEach((task: any) => {
                    // Normalize hours to 2 decimal places
                    const hours = (task.totalSeconds / 3600).toFixed(2).replace('.', ',');
                    const manualHours = (task.manualSeconds / 3600).toFixed(2).replace('.', ',');
                    const reason = task.manualReason ? task.manualReason.replace(/\n/g, ' ') : '';

                    rows.push([
                        user.userName,
                        client.clientName,
                        task.taskTitle,
                        hours,
                        reason,
                        task.manualSeconds > 0 ? manualHours : ''
                    ]);
                });
            });
        });

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(";")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_horas_${startDate.toLocaleDateString()}_${endDate.toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("MktNow - Relatório de Horas", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const periodStr = `Período: ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`;
        doc.text(periodStr, 14, 28);

        // Calculate Total Hours for Header
        let totalHours = 0;
        hierarchy.forEach(u => totalHours += u.totalHours);
        doc.text(`Total Geral: ${totalHours.toFixed(2)} horas`, 14, 33);

        const tableRows: any[] = [];
        const tableColumn = ["Colaborador", "Cliente", "Tarefa", "Tempo (h)", "Auditoria"];

        hierarchy.forEach(user => {
            user.clients.forEach((client: any) => {
                client.tasks.forEach((task: any) => {
                    const hours = (task.totalSeconds / 3600).toFixed(2);
                    const isManual = task.manualSeconds > 0;
                    const reason = task.manualReason || '';

                    tableRows.push([
                        user.userName,
                        client.clientName,
                        task.taskTitle,
                        hours,
                        isManual ? `(Manual) ${reason}` : ''
                    ]);
                });
            });
        });

        // Add proper type for doc to avoid lint errors if possible, or just cast as any if strictly needed by autotable typings
        (autoTable as any)(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [22, 163, 74] }, // Primary Green-ish
            columnStyles: {
                0: { cellWidth: 25 }, // Colaborador
                1: { cellWidth: 25 }, // Client
                2: { cellWidth: 'auto' }, // Task
                3: { cellWidth: 20, halign: 'right' }, // Time
                4: { cellWidth: 50 }, // Audit
            }
        });

        doc.save(`relatorio_mktnow_${startDate.toLocaleDateString()}_${endDate.toLocaleDateString()}.pdf`);
        setShowExportMenu(false);
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in relative min-h-[500px]">
            {/* 1. Top Filter Bar (Aligned) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface-dark border border-gray-800 p-4 rounded-xl shadow-lg z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full lg:w-auto">
                    <ModernDropdown
                        options={teamOptions}
                        value={selectedTeamId}
                        onChange={setSelectedTeamId}
                        placeholder="Equipe"
                        icon="group"
                    />
                    <ModernDropdown
                        options={clientOptions}
                        value={selectedClientId}
                        onChange={setSelectedClientId}
                        placeholder="Cliente"
                        icon="domain"
                    />
                    <ModernDropdown
                        options={userOptions}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        placeholder="Usuário"
                        icon="person"
                    />
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(s, e) => {
                            setStartDate(s);
                            setEndDate(e);
                        }}
                    />
                </div>

                <div className="w-full lg:w-auto flex justify-end gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm font-medium whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined">download</span>
                            Exportar
                        </button>
                        {showExportMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-surface-dark border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in flex flex-col">
                                <button onClick={handleExportPDF} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-sm text-gray-300 hover:text-white transition-colors border-b border-gray-800">
                                    <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                                    <span>Exportar PDF</span>
                                </button>
                                <button onClick={handleExportCSV} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-sm text-gray-300 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-green-400">csv</span>
                                    <span>Exportar Excel/CSV</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowInsights(true)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all text-sm font-medium whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined">insights</span>
                        Ver Insights
                    </button>
                </div>
            </div>

            {/* 2. Main List (User -> Client -> Tasks) */}
            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    Carregando dados da equipe...
                </div>
            ) : hierarchy.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-surface-dark border border-gray-800 rounded-xl">
                    Nenhum registro encontrado para este filtro.
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {hierarchy.map((user: any) => {
                        // Recalculate utilization to ensure no 0% if total > 0
                        const safeCapacity = user.weeklyCapacity || 40;
                        const safeUtilization = (user.totalHours / safeCapacity) * 100;
                        const displayUtilization = Math.min(safeUtilization, 100);

                        return (
                            <div key={user.userId} className="bg-surface-dark border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                                {/* User Header with Metrics */}
                                <div className="bg-background-dark/80 p-5 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 backdrop-blur-sm gap-4">
                                    <div className="flex items-center gap-4">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} className="w-12 h-12 rounded-full border border-gray-700" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-lg">
                                                {user.userName.charAt(0)}
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="text-white font-bold text-lg">{user.userName}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                {/* Capacity Bar */}
                                                <div className="flex flex-col gap-1 w-32">
                                                    <div className="flex justify-between text-[10px] uppercase text-gray-500 font-bold">
                                                        <span>Capacidade</span>
                                                        <span>{safeUtilization.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${safeUtilization > 100 ? 'bg-red-500' :
                                                                safeUtilization > 80 ? 'bg-yellow-500' : 'bg-primary'
                                                                }`}
                                                            style={{ width: `${displayUtilization}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Fidelity Badge */}
                                                <div className="flex items-center gap-1 px-2 py-1 bg-black/20 rounded border border-white/5">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Fidelidade</span>
                                                    <span className={`text-xs font-bold ${(100 - user.manualPercentage) > 90 ? 'text-green-400' : 'text-yellow-400'
                                                        }`}>
                                                        {(100 - user.manualPercentage).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right pl-[64px] md:pl-0">
                                        {/* Use totalSeconds if available, else standard hours */}
                                        <div className="text-3xl font-bold text-white font-mono tracking-tight">
                                            {formatHours(user.totalSeconds || user.totalHours, !!user.totalSeconds)}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Total Horas</div>
                                    </div>
                                </div>

                                {/* Clients List */}
                                <div className="divide-y divide-gray-800/50">
                                    {user.clients.length === 0 ? (
                                        <div className="p-6 text-center text-gray-600 text-sm">Sem atividades registradas.</div>
                                    ) : user.clients.map((client: any) => (
                                        <div key={client.clientId} className="group">
                                            {/* Client Header - Subtle as requested */}
                                            <div className="bg-white/5 p-2 px-6 flex justify-between items-center group-hover:bg-white/10 transition-all">
                                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px]">domain</span>
                                                    {client.clientName}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-600 bg-black/20 px-2 py-0.5 rounded">
                                                    {formatHours(client.totalSeconds || client.totalHours, !!client.totalSeconds)}
                                                </span>
                                            </div>

                                            {/* Tasks List */}
                                            <div className="bg-transparent">
                                                {client.tasks.map((task: any) => (
                                                    <div key={task.taskId} className="flex justify-between items-center py-3 px-6 pl-10 hover:bg-white/[0.02] border-t border-gray-800/30">
                                                        <span className="text-sm text-gray-300 font-medium">{task.taskTitle}</span>
                                                        <div className="flex items-center gap-4">
                                                            {/* Main Total Time (Timer + Manual) */}
                                                            <span className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors">
                                                                {formatHours(task.totalSeconds || task.totalHours, !!task.totalSeconds)}
                                                            </span>

                                                            {/* Audit Column (Only Manual Time) */}
                                                            {task.manualSeconds > 0 && (
                                                                <div className="group/audit relative flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                                    <span className="text-orange-400 text-xs font-mono font-bold">
                                                                        {formatHours(task.manualSeconds, true)}
                                                                    </span>
                                                                    <span className="text-lg cursor-help">✍️</span>

                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full right-0 mb-2 w-max max-w-[300px] p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/audit:opacity-100 group-hover/audit:visible transition-all z-50 text-xs text-gray-300 pointer-events-none whitespace-normal break-words">
                                                                        <div className="font-bold text-orange-400 mb-1 border-b border-gray-700 pb-1">Auditoria de Tempo</div>
                                                                        <div className="leading-relaxed">{task.manualReason || 'Sem motivo informado.'}</div>
                                                                        <div className="absolute bottom-[-6px] right-3 w-3 h-3 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 3. Insights Modal */}
            {showInsights && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface-dark border border-gray-700 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-background-dark">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">insights</span>
                                Insights da Equipe
                            </h2>
                            <button onClick={() => setShowInsights(false)} className="text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-surface-dark grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-white font-bold mb-4">Mapa de Trabalho</h3>
                                <WorkHeatmap blocks={timeline} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-4">Gargalos por Categoria</h3>
                                <CategoryBottleneckChart categories={categories} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
