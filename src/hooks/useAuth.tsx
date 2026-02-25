/**
 * @file src/hooks/useAuth.tsx
 * @description Authentication context, provider, and hook.
 *
 * Manages the logged-in user's session lifecycle including sign-up, login,
 * Google OAuth, logout, guest access, and password-less app resets.
 *
 * User state is persisted to `localStorage` under `planr_user` so sessions
 * survive page refreshes. Auth events from Supabase (e.g. OAuth redirects)
 * are picked up via `onAuthStateChange` and sync state automatically.
 *
 * Usage:
 *   const { user, login, logout } = useAuth();
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { sqliteAuthService, type User } from '../services/sqliteAuthService';
import { pullFromCloud } from '../services/syncService';

/** Shape of the values exposed by the Auth context. */
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    /** Wipes all local user data and Supabase session — use with caution. */
    resetApp: () => Promise<void>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/** Wraps the subtree with authentication state and utility functions. */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore the session from localStorage on first mount
        const storedUser = localStorage.getItem('planr_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);

        // Listen for OAuth redirects and other auth state changes
        let authSubscription: any;
        const initAuthListener = async () => {
            const { supabase } = await import('../lib/supabase');
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const authUser: User = {
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata?.name || 'Athlete'
                    };
                    setUser(authUser);
                    localStorage.setItem('planr_user', JSON.stringify(authUser));
                    // Pull cloud data (programs + logs) into localStorage after OAuth sign-in
                    pullFromCloud(authUser.id).catch(err =>
                        console.error('[Auth] Cloud pull after OAuth failed:', err)
                    );
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    localStorage.removeItem('planr_user');
                }
            });
            authSubscription = data.subscription;
        };

        initAuthListener();

        return () => {
            // Unsubscribe from the Supabase listener when the provider unmounts
            if (authSubscription) {
                authSubscription.unsubscribe();
            }
        };
    }, []);

    /** Authenticates an existing user with email and password, then pulls cloud data. */
    const login = async (email: string, password: string) => {
        try {
            const loggedInUser = await sqliteAuthService.loginUser(email, password);
            setUser(loggedInUser);
            localStorage.setItem('planr_user', JSON.stringify(loggedInUser));
            // Hydrate localStorage with the user's cloud programs and logs
            await pullFromCloud(loggedInUser.id);
        } catch (error: any) {
            throw error;
        }
    };

    /** Creates a new account, signs the user in, and pulls any existing cloud data. */
    const signUp = async (email: string, password: string, name: string) => {
        try {
            const newUser = await sqliteAuthService.registerUser(email, password, name);
            setUser(newUser);
            localStorage.setItem('planr_user', JSON.stringify(newUser));
            // Pull from cloud in case they had data from a previous session
            await pullFromCloud(newUser.id);
        } catch (error: any) {
            throw error;
        }
    };
    
    /** Initiates the Google OAuth flow — the page will redirect to Google's consent screen. */
    const loginWithGoogle = async () => {
         try {
             await sqliteAuthService.loginWithGoogle();
             // The page will redirect to Google's consent screen.
             // Session info will be handled automatically by Supabase Auth upon return, 
             // we'll need a session listener to catch the login event (which we may already need to add).
         } catch (error: any) {
             throw error;
         }
    };

    /** Signs out locally and redirects to /login. */
    const logout = async () => {
        setUser(null);
        localStorage.removeItem('planr_user');
        window.location.href = '/login';
    };

    /** Destroys the Supabase session AND clears all local state. Used by Settings → Reset App. */
    const resetApp = async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
        localStorage.removeItem('planr_user');
        setUser(null);
    };

    /** Allows users to access the app without registering, under a synthetic guest account. */
    const continueAsGuest = () => {
        const guestUser: User = {
            id: 'guest',
            email: 'guest@planr.app',
            name: 'Guest Athlete'
        };
        setUser(guestUser);
        localStorage.setItem('planr_user', JSON.stringify(guestUser));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, signUp, logout, resetApp, continueAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
};

/** Custom hook to consume the Auth context. Must be used inside `<AuthProvider>`. */
export const useAuth = () => useContext(AuthContext);
