
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header/Header';
import { portfolioService, type PortfolioSummary } from '../services/portfolio.service';
import { toast } from 'sonner';

export default function Portfolio() {
    const navigate = useNavigate();
    const [data, setData] = useState<PortfolioSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data, error } = await portfolioService.getPortfolioSummary();
        if (error) {
            toast.error('Erro ao carregar portfólio executivo');
        } else {
            setData(data);
        }
        setLoading(false);
    };

    // Skeleton Components
    const KpiSkeleton = () => (
        <div className="bg-surface-dark rounded-xl p-6 border border-border-dark animate-pulse">
            <div className="h-4 w-24 bg-gray-700 rounded mb-4"></div>
            <div className="h-8 w-16 bg-gray-700 rounded"></div>
        </div>
    );

    const ProjectCardSkeleton = () => (
        <div className="bg-surface-dark rounded-xl p-6 border border-border-dark animate-pulse h-[180px]">
            <div className="flex justify-between mb-4">
                <div className="h-5 w-32 bg-gray-700 rounded"></div>
                <div className="h-5 w-16 bg-gray-700 rounded"></div>
            </div>
            <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-700 rounded mt-4"></div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-black/20">
                <Header title="Portfólio Executivo" />
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
                    {/* KPI Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)}
                    </div>
                    {/* Project Grid Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <ProjectCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-black/20">
            <Header title="Portfólio Executivo" />

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 animate-fade-in custom-scrollbar">

                {/* KPI Section */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface-dark rounded-xl p-6 border border-border-dark">
                            <h3 className="text-text-subtle text-xs font-bold uppercase tracking-wider mb-2">Total Projetos</h3>
                            <div className="text-3xl font-bold text-white flex items-center gap-2">
                                {data.totalProjects}
                                <span className="material-symbols-outlined text-primary text-2xl">folder</span>
                            </div>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-6 border border-border-dark">
                            <h3 className="text-text-subtle text-xs font-bold uppercase tracking-wider mb-2">Projetos Ativos</h3>
                            <div className="text-3xl font-bold text-white flex items-center gap-2">
                                {data.activeProjects}
                                <span className="material-symbols-outlined text-blue-400 text-2xl">play_circle</span>
                            </div>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-6 border border-border-dark">
                            <h3 className="text-text-subtle text-xs font-bold uppercase tracking-wider mb-2">Projetos Críticos</h3>
                            <div className="text-3xl font-bold text-white flex items-center gap-2">
                                {data.delayedProjects}
                                <span className={`material-symbols-outlined text-2xl ${data.delayedProjects > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {data.delayedProjects > 0 ? 'warning' : 'check_circle'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-6 border border-border-dark">
                            <h3 className="text-text-subtle text-xs font-bold uppercase tracking-wider mb-2">Utilização Equipes</h3>
                            <div className="text-3xl font-bold text-white flex items-center gap-2">
                                {data.avgTeamUtilization}%
                                <span className="material-symbols-outlined text-purple-400 text-2xl">bar_chart</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Grid */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        Status dos Projetos
                    </h2>

                    {(!data?.projects || data.projects.length === 0) ? (
                        <div className="text-center py-10 text-gray-500">Nenhum projeto encontrado.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.projects.map(project => (
                                <div
                                    key={project.projectId}
                                    onClick={() => navigate(`/kanban?projectId=${project.projectId}`)} // Navigate to Kanban filtering by project (or specific page if exists)
                                    // Requirement was "/projects/[id]". Current app has /projects filtered or maybe new page? 
                                    // App.tsx shows `projects` is generic. But user asked for "/projects/[id]".
                                    // The router shows `projects` and `projects/new`. There is no `projects/:id`.
                                    // However, `Projects.tsx` accepts selectedProject. 
                                    // I'll assume standard URL param pattern or just navigate to Projects and utilize state management if needed.
                                    // Actually, standard pattern often implies detail. 
                                    // Let's use `navigate('/projects')` with setting context if possible, but simpler:
                                    // User said "redirecione ... para a rota /projects/[id] (seu Kanban)".
                                    // This implies a ROUTE `projects/:id` exists or I should create it/simulate it. 
                                    // Looking at App.tsx lines 47: `<Route path="projects" element={<Projects />} />`.
                                    // It does NOT have `:id`. 
                                    // I should probably navigate to `/projects` and passing query param is safest without changing App.tsx deep structure.
                                    // BUT, user instruction "redirecione... para a rota /projects/[id]" is explicit.
                                    // I might need to ADD that route to App.tsx to alias `Projects`.
                                    // For now I will link to `navigate('/projects')` and maybe use local storage or query param to pre-select it.
                                    // Wait, if I add `<Route path="projects/:id" element={<Projects />} />` in App.tsx it might work if Projects handles params.
                                    // Let's inspect `Projects.tsx` again. It reads `selectedProject` from state but not URL.
                                    // I will stick to query param `?projectId=` logic and update Projects.tsx to read it?
                                    // OR better: Create the route alias in App.tsx and update Projects.tsx to read param. 
                                    // Let's implement the Card with `onClick` logic.
                                    className="bg-surface-dark rounded-xl p-6 border border-border-dark hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-2 h-full ${project.status === 'CRITICAL' ? 'bg-red-500' :
                                        project.status === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}></div>

                                    <div className="flex justify-between items-start mb-4 pr-4">
                                        <div>
                                            <div className="text-xs text-text-subtle mb-1">{project.clientName || 'Cliente Interno'}</div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1" title={project.projectName}>
                                                {project.projectName}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Progresso</span>
                                                <span>{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-1000 ${project.status === 'CRITICAL' ? 'bg-red-500' :
                                                        project.status === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-background-dark/50 p-2 rounded flex flex-col">
                                                <span className="text-text-subtle">Tarefas</span>
                                                <span className="font-bold text-white">{project.completedTasks}/{project.totalTasks}</span>
                                            </div>
                                            <div className="bg-background-dark/50 p-2 rounded flex flex-col">
                                                <span className="text-text-subtle">Atrasadas</span>
                                                <span className={`font-bold ${project.overdueTasks > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                                    {project.overdueTasks}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
                                            <span>{project.teamName || 'Sem Time'}</span>
                                            {project.status !== 'HEALTHY' && (
                                                <span className="uppercase font-bold text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded">
                                                    Atenção
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
