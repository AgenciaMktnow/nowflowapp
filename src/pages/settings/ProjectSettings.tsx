import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

type Project = {
    id: string;
    name: string;
    description?: string;
    created_at: string;
};

export default function ProjectSettings() {
    const { userProfile } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('name');

            if (error) throw error;
            setProjects(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar projetos.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            // Check if exists
            const exists = projects.some(p => p.name.toLowerCase() === newProjectName.trim().toLowerCase());
            if (exists) {
                toast.error('Já existe um projeto com este nome.');
                return;
            }

            if (!userProfile?.organization_id) {
                toast.error("Erro de Segurança: Organização não identificada.");
                return;
            }

            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: newProjectName.trim(),
                    organization_id: userProfile.organization_id
                }])
                .select()
                .single();

            if (error) throw error;

            setProjects(prev => [...prev, data]);
            setNewProjectName('');
            toast.success('Projeto adicionado ao catálogo!');
        } catch (error: any) {
            toast.error(`Erro ao criar projeto: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover "${name}" do catálogo global? Isso não afetará contratos existentes, mas impedirá novos vínculos.`)) return;

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success('Projeto removido do catálogo.');
        } catch (error: any) {
            // Foreign key constraint likely prevents deletion if used
            if (error.code === '23503') { // Postgres FK violation code
                toast.error('Não é possível excluir este projeto pois ele está vinculado a clientes.');
            } else {
                toast.error(`Erro ao excluir: ${error.message}`);
            }
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Catálogo de Projetos (Serviços)</h2>
                <p className="text-text-muted">Gerencie os tipos de projetos/serviços globais que sua agência oferece (ex: SEO, Manutenção, Website).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create New */}
                <div className="bg-surface-dark p-6 rounded-xl border border-white/5 h-fit">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">add_circle</span>
                        Adicionar Novo Serviço
                    </h3>
                    <div className="flex gap-4">
                        <input
                            className="flex-1 bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 outline-none transition-all placeholder-text-muted"
                            placeholder="Nome do Serviço (ex: Consultoria de UX)"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                        <button
                            onClick={handleCreateProject}
                            disabled={isCreating || !newProjectName.trim()}
                            className="bg-primary text-background-dark font-bold px-6 rounded-lg hover:bg-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Adicionando...' : 'Adicionar'}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="bg-surface-dark p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">list</span>
                        Serviços Disponíveis ({projects.length})
                    </h3>

                    {isLoading ? (
                        <div className="text-text-muted py-4">Carregando catálogo...</div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {projects.length === 0 ? (
                                <div className="text-text-muted py-4 text-center border border-dashed border-white/10 rounded-lg">
                                    Nenhum serviço cadastrado.
                                </div>
                            ) : (
                                projects.map(project => (
                                    <div key={project.id} className="group flex items-center justify-between p-4 bg-background-dark rounded-lg border border-white/5 hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary/50">folder</span>
                                            <span className="text-white font-medium">{project.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteProject(project.id, project.name)}
                                            className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
                                            title="Remover do catálogo"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
