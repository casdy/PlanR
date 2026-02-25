/**
 * @file src/services/sqliteAuthService.ts
 * @description Authentication service backed by Supabase.
 *
 * Handles user registration, email/password login, and Google OAuth.
 * The `User` type here mirrors the one in `types/index.ts` but is kept
 * local to avoid circular dependencies with the auth context.
 */
import { supabase } from '../lib/supabase';

export interface User {
    id: string;
    email: string;
    name: string;
    isGuest?: boolean;
}

export const sqliteAuthService = {
    async registerUser(email: string, password: string, name: string): Promise<User> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name
                    }
                }
            });

            if (error) {
                 // Pass through exact Supabase validation message
                 throw new Error(error.message);
            }

            if (!data.user) {
                throw new Error('Sign up failed: No user returned.');
            }

            // Insert into our custom public.users table for relational integrity
            const { error: dbError } = await supabase
                .from('users')
                .insert([{
                    id: data.user.id,
                    email: email,
                    name: name
                }]);

            if (dbError) {
                console.error('[SupabaseAuth] Failed to insert public user record:', dbError);
                // We don't fail the whole registration if this fails, but it's good to log
            }

            return { id: data.user.id, email: data.user.email!, name };
        } catch (error: any) {
            console.error('[SupabaseAuth] Registration error:', error);
            throw new Error(error.message || 'Unknown registration error');
        }
    },

    async loginUser(email: string, password: string): Promise<User> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Incorrect email or password.');
                }
                throw new Error(error.message);
            }

            if (!data.user) {
                 throw new Error('Login failed: No user returned.');
            }

            const name = data.user.user_metadata?.name || 'Athlete';
            
            return { id: data.user.id, email: data.user.email!, name };
        } catch (error: any) {
             console.error('[SupabaseAuth] Login error:', error);
             throw new Error(error.message || 'Unknown login error');
        }
    },
    
    async loginWithGoogle(): Promise<void> {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('[SupabaseAuth] Google login error:', error);
            throw new Error(error.message || 'Failed to sign in with Google');
        }
    },
    
    // We can add a logout method if needed, or handle it via supabase.auth.signOut() directly in the hook
    async logoutUser() {
        await supabase.auth.signOut();
    }
};
