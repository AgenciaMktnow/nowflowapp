import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService, type Team } from '../services/team.service';
import TeamDashboard from '../components/TeamDashboard';
import Header from '../components/layout/Header/Header';

export default function Teams() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        const { data } = await teamService.getTeams();
        if (data) {
            setTeams(data);
            if (data.length > 0 && !selectedTeamId) {
                setSelectedTeamId(data[0].id);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark overflow-hidden">
            <Header
                title="Equipes & Performance"
                rightElement={
                    <button
                        onClick={() => navigate('/settings?tab=teams')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-dark border border-border-dark rounded-lg text-text-subtle hover:text-white transition-colors text-xs font-medium"
                        title="Configurar Membros e Equipes"
                    >
                        <span className="material-symbols-outlined text-[16px]">settings</span>
                        Gerenciar
                    </button>
                }
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar List */}
                <div className="w-80 border-r border-border-dark flex flex-col bg-surface-dark/30">
                    <div className="p-4 border-b border-border-dark flex justify-between items-center bg-surface-dark/50 backdrop-blur-sm">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wide">Equipes</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {teams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeamId(team.id)}
                                className={`w-full flex items-center justify-between p-4 text-left border-b border-border-dark/50 transition-all ${selectedTeamId === team.id
                                    ? 'bg-primary/10 border-l-4 border-l-primary'
                                    : 'hover:bg-white/5 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <span className={`font-medium ${selectedTeamId === team.id ? 'text-white' : 'text-text-muted-dark'}`}>
                                    {team.name}
                                </span>
                                {selectedTeamId === team.id && (
                                    <span className="material-symbols-outlined text-primary text-[18px]">chevron_right</span>
                                )}
                            </button>
                        ))}
                        {teams.length === 0 && (
                            <div className="p-8 text-center text-text-subtle text-xs">
                                Nenhuma equipe encontrada.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                    {selectedTeamId ? (
                        <TeamDashboard key={selectedTeamId} teamId={selectedTeamId} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-subtle">
                            <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">groups</span>
                            <p>Selecione uma equipe para ver o dashboard.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
