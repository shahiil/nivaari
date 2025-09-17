import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'citizen' | 'admin' | 'supervisor';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'online' | 'offline';
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  currentUser: UserProfile | null;
  userData: UserProfile | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
}

const MongoAuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_PUBLIC_BASE_URL || 'https://nivaari.netlify.app';

export const MongoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        
        if (savedToken && savedUser) {
          const userProfile: UserProfile = JSON.parse(savedUser);
          setToken(savedToken);
          setCurrentUser(userProfile);
          setUserData(userProfile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/.netlify/functions/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setCurrentUser(data.user);
        setUserData(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/.netlify/functions/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role: 'citizen' }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setCurrentUser(data.user);
        setUserData(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token && currentUser) {
        // Update user status to offline (optional - could be done via API)
        await setOnlineStatus(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setCurrentUser(null);
      setUserData(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const setOnlineStatus = async (isOnline: boolean): Promise<void> => {
    if (!currentUser || !token) return;
    
    try {
      // This would require a separate API endpoint to update user status
      // For now, we'll just update locally
      const updatedUser = { ...currentUser, status: isOnline ? 'online' : 'offline' } as UserProfile;
      setCurrentUser(updatedUser);
      setUserData(updatedUser);
    } catch (error) {
      console.error('Set online status error:', error);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    userData,
    loading,
    token,
    login,
    signup,
    logout,
    setOnlineStatus,
  }), [currentUser, userData, loading, token]);

  return (
    <MongoAuthContext.Provider value={value}>
      {children}
    </MongoAuthContext.Provider>
  );
};

export const useMongoAuth = (): AuthContextValue => {
  const context = useContext(MongoAuthContext);
  if (!context) {
    throw new Error('useMongoAuth must be used within a MongoAuthProvider');
  }
  return context;
};