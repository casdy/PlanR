import React, { createContext, useContext, useState, useEffect } from 'react';
import { sqliteAuthService, type User } from '../services/sqliteAuthService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    resetApp: () => Promise<void>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial load from local storage
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
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    localStorage.removeItem('planr_user');
                }
            });
            authSubscription = data.subscription;
        };

        initAuthListener();

        return () => {
            if (authSubscription) {
                authSubscription.unsubscribe();
            }
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const loggedInUser = await sqliteAuthService.loginUser(email, password);
            setUser(loggedInUser);
            localStorage.setItem('planr_user', JSON.stringify(loggedInUser));
        } catch (error: any) {
            throw error;
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            const newUser = await sqliteAuthService.registerUser(email, password, name);
            setUser(newUser);
            localStorage.setItem('planr_user', JSON.stringify(newUser));
        } catch (error: any) {
            throw error;
        }
    };
    
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

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('planr_user');
        window.location.href = '/login';
    };

    const resetApp = async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
        localStorage.removeItem('planr_user');
        setUser(null);
    };

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

export const useAuth = () => useContext(AuthContext);
