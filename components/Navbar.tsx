'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, userData, loading, logout } = useAuth();
  const hideNavbarRoutes = ['/login', '/signup', '/moderator-dashboard'];
  
  // Hide navbar on login, signup, and moderator dashboard pages
  if (hideNavbarRoutes.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Nivaari
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {currentUser && userData && (
              <>
                <Link
                  href={userData.role === 'admin' ? '/admin-dashboard' : userData.role === 'moderator' ? '/moderator-dashboard' : '/citizen-dashboard'}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Map
                </Link>
                {userData.role === 'moderator' && (
                  <Link href="/moderator/reports" className="text-foreground hover:text-primary transition-colors">
                    Reports
                  </Link>
                )}
                {userData.role === 'citizen' && (
                  <Link href="/report" className="text-foreground hover:text-primary transition-colors">
                    Report Issue
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : currentUser && userData ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {userData.name}
                </span>
                <Link href={userData.role === 'admin' ? '/admin-dashboard' : userData.role === 'moderator' ? '/moderator-dashboard' : '/citizen-dashboard'}>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="outline" size="sm">
              Menu
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;