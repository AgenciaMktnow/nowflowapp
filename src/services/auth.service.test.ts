import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
        })),
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signUp', () => {
        it('should return user and session on successful signup', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            const mockSession = { access_token: 'token' };

            // Setup mock implementation
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

            const result = await authService.signUp({ email: 'test@example.com', password: 'password' });

            expect(result.user).toEqual(mockUser);
            expect(result.session).toEqual(mockSession);
            expect(result.error).toBeNull();
            expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
        });

        it('should return mapped error on failure', async () => {
            // Setup mock implementation
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'User already registered' },
            });

            const result = await authService.signUp({ email: 'existing@example.com', password: 'password' });

            expect(result.user).toBeNull();
            expect(result.error).toBeDefined();
            expect(result.error?.message).toBe('Este e-mail já está em uso.');
        });
    });

    describe('signIn', () => {
        it('should return user and session on successful login', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            const mockSession = { access_token: 'token' };

            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

            const result = await authService.signIn({ email: 'test@example.com', password: 'password' });

            expect(result.user).toEqual(mockUser);
            expect(result.session).toEqual(mockSession);
            expect(result.error).toBeNull();
        });

        it('should return mapped error for invalid credentials', async () => {
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid login credentials' },
            });

            const result = await authService.signIn({ email: 'test@example.com', password: 'wrongpassword' });

            expect(result.error?.message).toBe('E-mail ou senha incorretos.');
        });
    });

    describe('signOut', () => {
        it('should sign out successfully', async () => {
            (supabase.auth.signOut as any).mockResolvedValue({ error: null });

            const result = await authService.signOut();

            expect(result.error).toBeNull();
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });
});
