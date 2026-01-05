import { supabase } from '../lib/supabase';
import type { User, Session, SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

// Define return types for better type safety
interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: Error | null;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CLIENT';
}

// Helper to translate Supabase errors to user-friendly messages
function mapAuthError(error: Error | null): Error | null {
    if (!error) return null;

    const message = error.message.toLowerCase();

    // Auth Errors
    if (message.includes('invalid login credentials')) return new Error('E-mail ou senha incorretos.');
    if (message.includes('user not found')) return new Error('Usuário não encontrado.');
    if (message.includes('email not confirmed')) return new Error('E-mail não confirmado. Verifique sua caixa de entrada.');
    if (message.includes('password should be at least')) return new Error('A senha deve ter pelo menos 6 caracteres.');
    if (message.includes('already registered')) return new Error('Este e-mail já está em uso.');
    if (message.includes('rate limit exceeded')) return new Error('Muitas tentativas. Tente novamente mais tarde.');

    // Fallback for unknown errors
    return new Error('Ocorreu um erro na autenticação. Tente novamente.');
}

export const authService = {
    /**
     * Sign up a new user
     */
    async signUp(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signUp(credentials);
        return {
            user: data.user,
            session: data.session,
            error: mapAuthError(error)
        };
    },

    /**
     * Sign in an existing user
     */
    async signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        return {
            user: data.user,
            session: data.session,
            error: mapAuthError(error)
        };
    },

    /**
     * Sign in with Google (OAuth)
     */
    async signInWithGoogle(): Promise<{ error: Error | null }> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        return { error: mapAuthError(error) };
    },

    /**
     * Sign out the current user
     */
    async signOut(): Promise<{ error: Error | null }> {
        const { error } = await supabase.auth.signOut();
        return { error: mapAuthError(error) };
    },

    /**
     * Get the current session
     */
    async getSession(): Promise<{ session: Session | null; error: Error | null }> {
        console.log("AuthService: getSession called");
        const { data, error } = await supabase.auth.getSession();
        console.log("AuthService: getSession result", { hasSession: !!data.session, error });
        return { session: data.session, error: mapAuthError(error) };
    },

    /**
     * Send password reset email
     */
    async resetPasswordForEmail(email: string, redirectTo: string): Promise<{ error: Error | null }> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        });
        return { error: mapAuthError(error) };
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * Fetch user profile from the 'users' table
     */
    async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { data: data as UserProfile, error: null };
        } catch (error: any) {
            return { data: null, error: mapAuthError(error) };
        }
    }
};
