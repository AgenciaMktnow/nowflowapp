import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { settingsService, type SystemSettings } from '../services/settings.service';

interface SettingsContextType {
    settings: Partial<SystemSettings>;
    refreshSettings: () => Promise<void>;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Partial<SystemSettings>>({});
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const data = await settingsService.getSettings();
            if (data) {
                setSettings(data);

                // Update Favicon dynamically
                if (data.favicon_url) {
                    const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
                    link.type = 'image/x-icon';
                    link.rel = 'shortcut icon';
                    link.href = data.favicon_url;
                    if (!link.parentNode) {
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, refreshSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
