import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  signer_uuid: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (userData: AuthUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('farcaster_auth');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('farcaster_auth');
      }
    }
  }, []);

  const signIn = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('farcaster_auth', JSON.stringify(userData));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('farcaster_auth');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
