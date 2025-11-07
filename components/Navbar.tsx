'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import StarBorder from '@/components/StarBorder';
import { 
  Menu, 
  X, 
  Shield, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, userData, loading, logout } = useAuth();
  const hideNavbarRoutes = ['/login', '/signup', '/moderator-dashboard', '/admin-dashboard', '/auth'];

  // Hide navbar on login, signup, moderator and admin dashboard pages
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track scroll position for navbar glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide navbar on login and signup pages
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
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
                  ${scrolled ? 'glass-navbar shadow-lg' : 'bg-transparent'}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                className="flex items-center justify-center transition-all duration-300 mr-3"
                whileHover={{ scale: 1.05, rotate: 3 }}
              >
                {/* Larger emblem for visibility; responsive sizes */}
                <img src="/logo-emblem.png" alt="Nivaari" className="w-12 h-12 md:w-14 md:h-14 object-contain" />
              </motion.div>

              <span
                className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Nivaari
              </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors nav-link">
              Home
            </Link>
            {currentUser && userData && (
              <motion.div className="flex items-center space-x-6" layout>
                <Link
                  href={userData.role === 'admin' ? '/admin-dashboard' : 
                        userData.role === 'moderator' ? '/moderator-dashboard' : '/citizen-dashboard'}
                  className="text-gray-300 hover:text-white transition-colors nav-link"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </Link>
                {userData.role === 'moderator' && (
                  <Link href="/moderator/reports" className="text-gray-300 hover:text-white transition-colors nav-link">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Reports
                    </span>
                  </Link>
                )}
                {userData.role === 'citizen' && (
                  <Link href="/report" className="text-gray-300 hover:text-white transition-colors nav-link">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Report Issue
                    </span>
                  </Link>
                )}
              </motion.div>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <motion.div 
                className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : currentUser && userData ? (
              <motion.div className="flex items-center space-x-4" layout>
                <span className="hidden sm:block text-sm text-gray-300">
                  Welcome, {userData.name}
                </span>
                <Button 
                  variant="outline"
                  className="glass-panel px-4 py-2 text-sm font-medium hover:bg-white/20"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </motion.div>
            ) : (
              <motion.div className="flex items-center space-x-3" layout>
                <Link href="/login">
                  <StarBorder
                    as="button"
                    color="cyan"
                    speed="5s"
                    className="hover:scale-110 hover:shadow-glow transition-all duration-300"
                  >
                    <span className="text-white font-medium">Login</span>
                  </StarBorder>
                </Link>
                <Link href="/signup">
                  <StarBorder
                    as="button"
                    color="purple"
                    speed="4s"
                    className="hover:scale-110 hover:shadow-glow-purple transition-all duration-300"
                  >
                    <span className="text-white font-medium">Sign Up</span>
                  </StarBorder>
                </Link>
              </motion.div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden glass-panel p-2 rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden glass-panel border-t border-white/10 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link 
                href="/"
                className="block text-gray-300 hover:text-white transition-colors nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {currentUser && userData && (
                <>
                  <Link
                    href={userData.role === 'admin' ? '/admin-dashboard' : 
                          userData.role === 'moderator' ? '/moderator-dashboard' : '/citizen-dashboard'}
                    className="block text-gray-300 hover:text-white transition-colors nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </span>
                  </Link>
                  {userData.role === 'moderator' && (
                    <Link
                      href="/moderator/reports"
                      className="block text-gray-300 hover:text-white transition-colors nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Reports
                      </span>
                    </Link>
                  )}
                  {userData.role === 'citizen' && (
                    <Link
                      href="/report"
                      className="block text-gray-300 hover:text-white transition-colors nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Report Issue
                      </span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;