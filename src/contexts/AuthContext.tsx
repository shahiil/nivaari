import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { getUserByUid, updateUserLastLogin } from '@/utils/localStorage';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('AuthContext - Auth state changed:', user?.uid);
      setCurrentUser(user);
      
      if (user) {
        // Get user data from localStorage using utility function
        const foundUserData = getUserByUid(user.uid);
        console.log('AuthContext - Found user data:', foundUserData);
        
        if (foundUserData) {
          // Update last login time
          updateUserLastLogin(user.uid);
          setUserData(foundUserData);
        } else {
          console.error('AuthContext - User authenticated but no data found in localStorage for UID:', user.uid);
          setUserData(null);
        }
      } else {
        console.log('AuthContext - User not authenticated');
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};