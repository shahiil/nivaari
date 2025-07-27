import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { getUserByUid } from '@/utils/localStorage';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'citizen';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const { currentUser, userData, loading } = useAuth();

  console.log('PrivateRoute - Auth state:', { loading, currentUser: currentUser?.uid, userData });
  
  // Show loading while checking auth state
  if (loading) {
    console.log('PrivateRoute - Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!currentUser) {
    console.log('PrivateRoute - User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Double-check user data from localStorage
  const localUserData = getUserByUid(currentUser.uid);
  console.log('PrivateRoute - User data from context:', userData);
  console.log('PrivateRoute - User data from localStorage:', localUserData);
  
  // Use localStorage data as fallback if context data is missing
  const effectiveUserData = userData || localUserData;
  
  if (!effectiveUserData) {
    console.log('PrivateRoute - No user data available, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If role is specified and user doesn't have that role, redirect to appropriate dashboard
  if (role && effectiveUserData.role !== role) {
    console.log(`PrivateRoute - User does not have required role: ${role}, user role: ${effectiveUserData.role}`);
    return <Navigate to={effectiveUserData.role === 'admin' ? '/admin' : '/citizen'} replace />;
  }
  
  console.log(`PrivateRoute - Access granted to: ${userData.name}, role: ${userData.role}`);

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
};

export default PrivateRoute;