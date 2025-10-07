'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type RouteRole = 'citizen' | 'admin' | 'moderator';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: RouteRole;
}

const roleToDashboard: Record<RouteRole, string> = {
  citizen: '/citizen-dashboard',
  admin: '/admin-dashboard',
  moderator: '/moderator-dashboard',
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  if (!currentUser || !userData) {
    redirect('/login');
  }

  if (role && userData.role !== role) {
    const redirectPath = roleToDashboard[userData.role as RouteRole];
    redirect(redirectPath);
  }

  return <>{children}</>;
};

export default PrivateRoute;