import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sqliteAuthService } from '../src/services/sqliteAuthService';
import { supabase } from '../src/lib/supabase';

// Mock Supabase client
vi.mock('../src/lib/supabase', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            insert: vi.fn(() => ({
                error: null
            }))
        }))
    }
}));

describe('Auth Service (Phase 1)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should successfully register a user', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: mockUser },
                error: null
            });

            const result = await sqliteAuthService.registerUser('test@example.com', 'password123', 'Test User');

            expect(result).toEqual({
                id: '123',
                email: 'test@example.com',
                name: 'Test User'
            });
            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                options: { data: { name: 'Test User' } }
            });
        });

        it('should throw an error on registration failure', async () => {
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: null },
                error: { message: 'Email already in use' }
            });

            await expect(sqliteAuthService.registerUser('test@example.com', 'password123', 'Test User'))
                .rejects.toThrow('Email already in use');
        });
    });

    describe('loginUser', () => {
        it('should successfully login a user', async () => {
            const mockUser = { 
                id: '123', 
                email: 'test@example.com',
                user_metadata: { name: 'Test User' }
            };
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: mockUser },
                error: null
            });

            const result = await sqliteAuthService.loginUser('test@example.com', 'password123');

            expect(result).toEqual({
                id: '123',
                email: 'test@example.com',
                name: 'Test User'
            });
        });

        it('should handle invalid credentials', async () => {
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid login credentials' }
            });

            await expect(sqliteAuthService.loginUser('test@example.com', 'wrongpassword'))
                .rejects.toThrow('Incorrect email or password.');
        });
    });
});
