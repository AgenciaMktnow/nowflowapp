export default function IntegrationsSettings() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 animate-fade-in-up">
            <div className="size-24 bg-surface-dark border border-border-green/30 rounded-full flex items-center justify-center mb-6 shadow-neon">
                <span className="material-symbols-outlined text-4xl text-primary">extension</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Integrações</h2>
            <p className="text-text-muted max-w-md mb-8">
                Conecte o NowFlow com suas ferramentas favoritas em breve.
                Slack, Google Calendar e Jira estão no roadmap.
            </p>
            <button
                disabled
                className="px-6 py-2 rounded-full bg-surface-dark border border-border-green/50 text-text-muted cursor-not-allowed opacity-50"
            >
                Em Breve
            </button>
        </div>
    );
}
