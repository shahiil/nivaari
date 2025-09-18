import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

type UserRole = 'citizen' | 'admin' | 'supervisor';

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  role: UserRole;
  status?: 'online' | 'offline';
  createdAt?: Date | string;
}

interface AuthContextValue {
  currentUser: User | null;
  userData: UserProfile | null;
  loading: boolean;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserData({ ...data, uid: user.uid });
          // Mark online on session start
          try {
            await updateDoc(userRef, { status: 'online' });
          } catch (error) {
            console.warn('Failed to update online status:', error);
          }
        } else {
          // No profile document found; do not auto-create for security reasons.
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        // Fire-and-forget; navigator.sendBeacon not used here to keep it simple
        updateDoc(userRef, { status: 'offline' }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  const setOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { status: isOnline ? 'online' : 'offline' });
  }, [currentUser]);

  const logout = useCallback(async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { status: 'offline' });
      } catch (error) {
        console.warn('Failed to update offline status:', error);
      }
    }
    await signOut(auth);
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    userData,
    loading,
    setOnlineStatus,
    logout,
  }), [currentUser, userData, loading, setOnlineStatus, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// End of file