'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type UserRole = 'citizen' | 'admin' | 'moderator';

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  status?: 'online' | 'offline';
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthContextValue {
  currentUser: UserProfile | null;
  userData: UserProfile | null;
  loading: boolean;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchSession(): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user ?? null;
  } catch (error) {
    console.warn('Failed to fetch session:', error);
    return null;
  }
}

async function postStatus(status: 'online' | 'offline'): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Failed to update status:', error);
    return false;
  }
}

async function postLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Failed to log out:', error);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((user: UserProfile | null) => {
    setCurrentUser(user);
    setUserData(user);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const user = await fetchSession();
    syncUser(user);
    setLoading(false);
  }, [syncUser]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      const user = await fetchSession();
      if (mounted) {
        syncUser(user);
        setLoading(false);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [syncUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const handleBeforeUnload = () => {
      try {
        const payload = JSON.stringify({ status: 'offline' });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/auth/status', blob);
        }
      } catch (error) {
        console.warn('Failed to send offline beacon:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  const setOnlineStatus = useCallback(
    async (isOnline: boolean) => {
      if (!currentUser) return;

      const success = await postStatus(isOnline ? 'online' : 'offline');
      if (success) {
        const updated: UserProfile = {
          ...currentUser,
          status: isOnline ? 'online' : 'offline',
        };
        syncUser(updated);
      }
    },
    [currentUser, syncUser]
  );

  const logout = useCallback(async () => {
    await postStatus('offline');
    await postLogout();
    syncUser(null);
  }, [syncUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      userData,
      loading,
      setOnlineStatus,
      logout,
      refresh,
    }),
    [currentUser, userData, loading, setOnlineStatus, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};