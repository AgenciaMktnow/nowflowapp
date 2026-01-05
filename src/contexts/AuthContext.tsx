import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CLIENT';
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserProfile = async (userId: string) => {
        try {
            console.log("Fetching user profile for:", userId);
            const { data, error } = await authService.getUserProfile(userId);

            if (!error && data) {
                console.log("User profile loaded:", data.email);
                setUserProfile(data as UserProfile);
            } else {
                console.error("Error loading user profile:", error);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            console.log("Auth loading finished.");
            setLoading(false);
        }
    };

    const loadingRef = React.useRef(true);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    useEffect(() => {
        console.log("%c AuthProvider: Mounting...", "color: #13ec5b; font-weight: bold;");
        let mounted = true;

        // Failsafe timeout
        const timeoutId = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.error("%c AuthProvider: 🚨 TIMEOUT reached (10s). Forcing loading=false.", "color: red; font-weight: bold;");
                setLoading(false);
                toast.error("O sistema demorou para responder. Verifique sua conexão.");
            }
        }, 10000);

        const initAuth = async () => {
            // ... existing code ...
            try {
                console.log("AuthProvider: Calling authService.getSession()...");
                const { session, error } = await authService.getSession();
                console.log("AuthProvider: getSession result:", { session: !!session, error });

                if (!mounted) return;

                if (error) {
                    console.error("AuthProvider: Init error:", error);
                    toast.error("Erro na inicialização: " + error.message);
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log("AuthProvider: Fetching user profile...");
                    await fetchUserProfile(session.user.id);
                } else {
                    console.log("AuthProvider: No session found. Finishing load.");
                    setLoading(false);
                }
            } catch (err) {
                console.error("AuthProvider: Unexpected crash:", err);
                if (mounted) setLoading(false);
            }
        };

        // Listen for changes on auth state
        const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
            console.log(`AuthProvider: Auth State Change [${_event}]`);

            if (_event === 'PASSWORD_RECOVERY') {
                console.log("AuthProvider: Password recovery detected! Redirecting to /reset-password");
                navigate('/reset-password');
                return;
            }

            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Do not await strictly here to avoid blocking UI on simple events, 
                // but for initial load it's handled above.
                // We might want to refresh profile on SIGN_IN.
                if (_event === 'SIGNED_IN') {
                    fetchUserProfile(session.user.id);
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        initAuth();

        return () => {
            console.log("AuthProvider: Unmounting.");
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await authService.signOut();
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, session, loading, signOut }}>
            {!loading ? children : (
                <div className="flex items-center justify-center h-screen w-full bg-[#102216] text-white">
                    <div className="flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl animate-spin text-[#13ec5b]">progress_activity</span>
                        <span className="font-display">Carregando NowFlow...</span>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
