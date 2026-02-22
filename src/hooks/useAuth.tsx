import React, { createContext, useContext, useState } from 'react';

interface MockUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
}

interface AuthContextType {
    user: MockUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const GUEST_USER: MockUser = {
    uid: 'guest',
    displayName: 'Guest User',
    email: 'guest@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<MockUser | null>(GUEST_USER);
    const [loading] = useState(false);

    const signInWithGoogle = async () => {
        setUser(GUEST_USER);
    };

    const logout = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
