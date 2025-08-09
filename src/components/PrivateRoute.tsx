import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type RouteRole = 'citizen' | 'admin' | 'supervisor';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: RouteRole;
}

const roleToDashboard: Record<RouteRole, string> = {
  citizen: '/citizen-dashboard',
  admin: '/admin-dashboard',
  supervisor: '/supervisor-dashboard',
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
    return <Navigate to="/login" replace />;
  }

  if (role && userData.role !== role) {
    const redirectPath = roleToDashboard[userData.role];
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;