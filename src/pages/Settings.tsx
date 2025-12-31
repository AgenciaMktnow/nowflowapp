import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header/Header';
import GeneralSettings from './settings/GeneralSettings';
import ClientManagement from './ClientManagement';
import TeamManagement from './TeamManagement';
import TeamsSettings from './settings/TeamsSettings';
import IntegrationsSettings from './settings/IntegrationsSettings';
import WorkflowsSettings from './settings/WorkflowsSettings';
import ProjectSettings from './settings/ProjectSettings';

type Tab = 'general' | 'clients' | 'projects' | 'workflows' | 'team' | 'teams_list' | 'integrations';

export default function Settings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/settings/clients')) setActiveTab('clients');
        else if (path.includes('/settings/projects')) setActiveTab('projects');
        else if (path.includes('/settings/workflows')) setActiveTab('workflows');
        else if (path.includes('/settings/teams')) setActiveTab('teams_list');
        else if (path.includes('/settings/team')) setActiveTab('team');
        else if (path.includes('/settings/integrations')) setActiveTab('integrations');
        else setActiveTab('general');
    }, [location.pathname]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        let route = '/settings';
        if (tab === 'clients') route = '/settings/clients';
        else if (tab === 'projects') route = '/settings/projects';
        else if (tab === 'workflows') route = '/settings/workflows';
        else if (tab === 'teams_list') route = '/settings/teams';
        else if (tab === 'team') route = '/settings/team';
        else if (tab === 'integrations') route = '/settings/integrations';

        navigate(route);
    };

    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'general': return 'Configurações > Geral';
            case 'clients': return 'Configurações > Clientes';
            case 'projects': return 'Configurações > Projetos';
            case 'workflows': return 'Configurações > Fluxos';
            case 'team': return 'Configurações > Usuários';
            case 'teams_list': return 'Configurações > Equipes';
            case 'integrations': return 'Configurações > Integrações';
            default: return 'Configurações';
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <Header
                title={getHeaderTitle()}
                onSearch={setSearchTerm}
                searchPlaceholder="Buscar nas configurações..."
                searchInitialValue={searchTerm}
            />

            <div className="flex-1 overflow-y-auto p-8 pb-20 scroll-smooth">
                {/* Tabs Navigation */}
                <div className="max-w-[1400px] mx-auto mb-8 border-b border-border-green/30">
                    <div className="flex items-center gap-8 overflow-x-auto">
                        <button
                            onClick={() => handleTabChange('general')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'general' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Geral
                            {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('clients')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'clients' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Clientes
                            {activeTab === 'clients' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('projects')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'projects' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Projetos
                            {activeTab === 'projects' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('workflows')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'workflows' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Fluxos
                            {activeTab === 'workflows' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('teams_list')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'teams_list' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Equipes
                            {activeTab === 'teams_list' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('team')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'team' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Usuários
                            {activeTab === 'team' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('integrations')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'integrations' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Integrações
                            {activeTab === 'integrations' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-[1400px] mx-auto min-h-[500px]">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'clients' && <ClientManagement />}
                    {activeTab === 'projects' && <ProjectSettings />}
                    {activeTab === 'workflows' && <WorkflowsSettings />}
                    {activeTab === 'teams_list' && <TeamsSettings />}
                    {activeTab === 'team' && <TeamManagement />}
                    {activeTab === 'integrations' && <IntegrationsSettings />}
                </div>
            </div>
        </div>
    );
}
