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
import { toast } from 'sonner';
import { usePermissions } from '../../hooks/usePermissions';
import { useUsers } from '../../hooks/useUsers'
import TimeFilters from '../../components/TimeFilters';


interface TeamOption {
    id: string;
    name: string;
}

interface TeamReportProps {
    users: { id: string, full_name: string, team?: string[] }[];
    teams: TeamOption[];
    filterTeam?: string;
    filterClient?: string;
    filterUser?: string;

    exportType?: 'pdf' | 'csv' | null
    setExportType?: (v: 'pdf' | 'csv' | null) => void

    openInsights?: boolean
    setOpenInsights?: (v:boolean)=>void
}



export default function TeamReport({ users, teams, filterTeam: initialFilterTeam, filterClient, filterUser, exportType, setExportType, openInsights, setOpenInsights }: TeamReportProps) {
    const [loading, setLoading] = useState(true);
    const [hierarchy, setHierarchy] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();

    const { can } = usePermissions();
    const canAdvancedReports = can('advanced_reports');

    const allUsers = useUsers() as {
        id: string
        full_name: string
        team?: string[]
    }[]




    // Filters Data
    // const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
    const [clients, setClients] = useState<TeamOption[]>([]);

    // Active Filters
    const [selectedTeamId, setSelectedTeamId] = useState<string>(initialFilterTeam || '');
    const [selectedClientId, setSelectedClientId] = useState<string>(filterClient || '');
    const [selectedUserId, setSelectedUserId] = useState<string>(filterUser || '');

    // Sync Props to State
    useEffect(() => {
        if (initialFilterTeam !== undefined) setSelectedTeamId(initialFilterTeam);
    }, [initialFilterTeam]);

    useEffect(() => {
        if (filterClient !== undefined) setSelectedClientId(filterClient);
    }, [filterClient]);

    useEffect(() => {
        if (filterUser !== undefined) setSelectedUserId(filterUser);
    }, [filterUser]);


    useEffect(() => {
        if (openInsights) {
            setShowInsights(true)
            setOpenInsights?.(false)
        }
    }, [openInsights])

    // Export State
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Date Logic Helper
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const [startDate, setStartDate] = useState<Date>(sevenDaysAgo);
    const [endDate, setEndDate] = useState<Date>(today);

    const [showInsights, setShowInsights] = useState(false);

    // Helpers
    const teamOptions = [{ id: '', name: 'Todas as Equipes' }, ...teams.map(t => ({ id: t.id, name: t.name }))];

    // Filter Users based on Selected Team
    const filteredUsers = selectedTeamId
        ? allUsers.filter((u: any) => u.team?.includes(selectedTeamId))
        : allUsers;

    const userOptions = [
        { id: '', name: 'Todos os usuários' },
        ...filteredUsers.map(u => ({
            id: u.id,
            name: u.full_name
        }))
    ];
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
            const { data, error } = await supabase
                .from('clients')
                .select('id, name')
                .order('name');

            if (error) {
                console.error('Erro ao buscar clientes:', error);
                return;
            }

            if (data) {
                setClients(data);
            }
        };

        fetchClients();
    }, []);
    // useEffect(() => {
    //     const fetchUsers = async () => {
    //         const { data } = await supabase
    //             .from('users')
    //             .select('id, full_name')
    //             .order('full_name');

    //         if (data) setAllUsers(data);
    //     };

    //     fetchUsers();
    // }, []);

    // Fetch Report Data
    useEffect(() => {
        loadReport();
    }, [selectedTeamId, selectedClientId, selectedUserId, startDate, endDate]);

    useEffect(() => {

        if (!exportType) return
        if (loading) return

        if (exportType === 'pdf') {
            handleExportPDF()
        }

        if (exportType === 'csv') {
            handleExportCSV()
        }

        setExportType?.(null)

    }, [exportType, loading])

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

    const insights = (() => {

        if (!hierarchy.length) return null

        let topUser = hierarchy[0]

        hierarchy.forEach(u => {
            const current = u.totalSeconds || 0
            const best = topUser.totalSeconds || 0

            if (current > best) {
                topUser = u
            }
        })

        const clientMap: Record<string, number> = {}
        const taskMap: Record<string, number> = {}

        hierarchy.forEach(user => {
            user.clients.forEach((client: any) => {

                clientMap[client.clientName] =
                    (clientMap[client.clientName] || 0) + client.totalSeconds

                client.tasks.forEach((task: any) => {
                    taskMap[task.taskTitle] =
                        (taskMap[task.taskTitle] || 0) + task.totalSeconds
                })

            })
        })

        const topClient = Object.entries(clientMap).sort((a,b)=>b[1]-a[1])[0]
        const topTask = Object.entries(taskMap).sort((a,b)=>b[1]-a[1])[0]

        return {
            topUser,
            topClient,
            topTask
        }

    })()

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

        if (loading || !hierarchy.length) {
            toast.error("Nenhum dado disponível para exportar.");
            return;
        }

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
        if (loading) {
            toast.error("Aguarde o carregamento do relatório.");
            return;
        }

        if (!hierarchy.length) {
            toast.error("Nenhum dado disponível para exportar.");
            return;
        }

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
            {/* <TimeFilters
                teams={teams}

                selectedTeamId={selectedTeamId}
                selectedClientId={selectedClientId}
                selectedUserId={selectedUserId}

                setSelectedTeamId={setSelectedTeamId}
                setSelectedClientId={setSelectedClientId}
                setSelectedUserId={setSelectedUserId}

                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}

                canAdvancedReports={canAdvancedReports}

                showExportMenu={showExportMenu}
                setShowExportMenu={setShowExportMenu}

                handleExportPDF={handleExportPDF}
                handleExportCSV={handleExportCSV}

                onInsightsClick={() => setShowInsights(true)}
            /> */}

            {/* <div className="flex justify-end gap-2">
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white"
                >
                    Exportar PDF
                </button>

                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white"
                >
                    Exportar CSV
                </button>

            </div> */}

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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#05070a]/80 backdrop-blur-2xl animate-in fade-in duration-300">

                <div className="relative w-full max-w-6xl h-[88vh] rounded-3xl overflow-hidden border border-[#1f2937] bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070c18] shadow-[0_40px_120px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300 flex flex-col">

                {/* HEADER */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-[#1e293b] bg-gradient-to-r from-[#111827] to-[#0b1120]">

                    <div className="flex items-center gap-4">

                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-[22px]">
                        insights
                        </span>
                    </div>

                    <div>
                        <h2 className="text-white text-lg font-semibold tracking-tight">
                        Insights de Performance
                        </h2>
                        <p className="text-gray-400 text-xs">
                        Análise estratégica do desempenho da equipe
                        </p>
                    </div>

                    </div>

                    <button
                    onClick={() => setShowInsights(false)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
                    >
                    <span className="material-symbols-outlined">close</span>
                    </button>

                </div>

                {/* CONTENT */}
                <div className="p-8 overflow-y-auto flex-1 space-y-10">

                    {/* ===== CARDS RESUMO ===== */}
                    {insights && (
                    <div>

                        <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                            analytics
                        </span>
                        <h3 className="text-white font-semibold text-sm tracking-wide">
                            Destaques do Período
                        </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* COLABORADOR */}
                        <div className="p-6 rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] hover:border-indigo-500/40 transition-all hover:-translate-y-1">

                            <div className="flex items-center justify-between mb-4">

                            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                                <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                                workspace_premium
                                </span>
                            </div>

                            <span className="text-xs text-gray-500 uppercase">
                                Colaborador
                            </span>

                            </div>

                            <div className="text-white font-semibold text-lg">
                            {insights.topUser.userName}
                            </div>

                            <div className="text-cyan-400 text-sm mt-1 font-medium">
                            {formatHours(insights.topUser.totalSeconds || 0, true)}
                            </div>

                        </div>


                        {/* CLIENTE */}
                        <div className="p-6 rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] hover:border-cyan-500/40 transition-all hover:-translate-y-1">

                            <div className="flex items-center justify-between mb-4">

                            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                                <span className="material-symbols-outlined text-cyan-400 text-[18px]">
                                business_center
                                </span>
                            </div>

                            <span className="text-xs text-gray-500 uppercase">
                                Cliente
                            </span>

                            </div>

                            <div className="text-white font-semibold text-lg">
                            {insights.topClient?.[0]}
                            </div>

                            <div className="text-cyan-400 text-sm mt-1 font-medium">
                            {formatHours(insights.topClient?.[1] || 0, true)}
                            </div>

                        </div>


                        {/* TAREFA */}
                        <div className="p-6 rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] hover:border-indigo-500/40 transition-all hover:-translate-y-1">

                            <div className="flex items-center justify-between mb-4">

                            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                                <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                                task_alt
                                </span>
                            </div>

                            <span className="text-xs text-gray-500 uppercase">
                                Tarefa
                            </span>

                            </div>

                            <div className="text-white font-semibold text-lg">
                            {insights.topTask?.[0]}
                            </div>

                            <div className="text-cyan-400 text-sm mt-1 font-medium">
                            {formatHours(insights.topTask?.[1] || 0, true)}
                            </div>

                        </div>

                        </div>

                    </div>
                    )}


                    {/* ===== MAPA DE ATIVIDADE (FULL WIDTH) ===== */}
                    <div className="rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] p-6">

                    <div className="flex items-center justify-between mb-6">

                        <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                            grid_view
                        </span>

                        <h3 className="text-white font-semibold text-sm tracking-wide">
                            Mapa de Atividade
                        </h3>
                        </div>

                        <span className="text-xs text-gray-500">
                        Distribuição de trabalho
                        </span>

                    </div>

                    <WorkHeatmap blocks={timeline} />

                    </div>


                    {/* ===== GARGALOS (FULL WIDTH) ===== */}
                    <div className="rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] p-6">

                    <div className="flex items-center justify-between mb-6">

                        <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400 text-[20px]">
                            monitoring
                        </span>

                        <h3 className="text-white font-semibold text-sm tracking-wide">
                            Gargalos por Categoria
                        </h3>
                        </div>

                        <span className="text-xs text-gray-500">
                        Identificação de atrasos
                        </span>

                    </div>

                    <CategoryBottleneckChart categories={categories} />

                    </div>

                </div>

                </div>

            </div>
            )}
        </div>
    );
}
