import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header/Header';
import GeneralSettings from './settings/GeneralSettings';
import ClientManagement from './ClientManagement';
import TeamManagement from './TeamManagement';
import IntegrationsSettings from './settings/IntegrationsSettings';
import WorkflowsSettings from './settings/WorkflowsSettings';
import ProjectSettings from './settings/ProjectSettings';
import NotificationsSettings from './settings/NotificationsSettings';
import BoardsSettings from './settings/BoardsSettings';
import TeamsSettings from './settings/TeamsSettings';

type Tab = 'general' | 'clients' | 'projects' | 'boards' | 'workflows' | 'team' | 'users' | 'integrations' | 'notifications';

export default function Settings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<Tab>('general');


    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/settings/clients')) setActiveTab('clients');
        else if (path.includes('/settings/projects')) setActiveTab('projects');
        else if (path.includes('/settings/boards')) setActiveTab('boards');
        else if (path.includes('/settings/workflows')) setActiveTab('workflows');
        else if (path.includes('/settings/team')) setActiveTab('team');
        else if (path.includes('/settings/users')) setActiveTab('users');
        else if (path.includes('/settings/integrations')) setActiveTab('integrations');
        else if (path.includes('/settings/notifications')) setActiveTab('notifications');
        else setActiveTab('general');
    }, [location.pathname]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        let route = '/settings';
        if (tab === 'clients') route = '/settings/clients';
        else if (tab === 'projects') route = '/settings/projects';
        else if (tab === 'boards') route = '/settings/boards';
        else if (tab === 'workflows') route = '/settings/workflows';
        else if (tab === 'team') route = '/settings/team';
        else if (tab === 'users') route = '/settings/users';
        else if (tab === 'integrations') route = '/settings/integrations';
        else if (tab === 'notifications') route = '/settings/notifications';

        navigate(route);
    };



    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <Header
                title="Configurações"
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
                            onClick={() => handleTabChange('boards')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'boards' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Quadros
                            {activeTab === 'boards' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>

                        <button
                            onClick={() => handleTabChange('workflows')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'workflows' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Fluxos
                            {activeTab === 'workflows' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>

                        <button
                            onClick={() => handleTabChange('team')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'team' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Equipes
                            {activeTab === 'team' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>

                        <button
                            onClick={() => handleTabChange('users')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'users' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Usuários
                            {activeTab === 'users' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                        <button
                            onClick={() => handleTabChange('notifications')}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'notifications' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            Notificações
                            {activeTab === 'notifications' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-neon"></span>}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-[1400px] mx-auto min-h-[500px]">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'clients' && <ClientManagement />}
                    {activeTab === 'projects' && <ProjectSettings />}
                    {activeTab === 'boards' && <BoardsSettings />}
                    {activeTab === 'workflows' && <WorkflowsSettings />}
                    {activeTab === 'team' && <TeamsSettings />}
                    {activeTab === 'users' && <TeamManagement />}
                    {activeTab === 'integrations' && <IntegrationsSettings />}
                    {activeTab === 'notifications' && <NotificationsSettings />}
                </div>
            </div>
        </div>
    );
}
