'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import Iridescence from './Iridescence';
import './FlipAuthCard.css';

interface FlipAuthCardProps {
  initialMode?: 'login' | 'signup';
}

export default function FlipAuthCard({ initialMode = 'login' }: FlipAuthCardProps) {
  const router = useRouter();
  const { currentUser, userData, loading, refresh } = useAuth();
  const [isFlipped, setIsFlipped] = useState(initialMode === 'signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = !isFlipped;

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && currentUser && userData) {
      if (userData.role === 'admin') router.push('/admin-dashboard');
      else if (userData.role === 'moderator') router.push('/moderator-dashboard');
      else router.push('/citizen-dashboard');
    }
  }, [currentUser, userData, loading, router]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isLogin) {
      if (!formData.name || !formData.confirmPassword) {
        toast.error('Please fill in all fields');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Email is already registered. Try logging in.');
          return;
        }
        const message = data?.error || 'Authentication failed. Please try again.';
        toast.error(message);
        return;
      }

      await refresh();
      toast.success(isLogin ? 'Login successful!' : 'Account created successfully!');

      const role = data.user?.role || 'citizen';
      if (role === 'admin') router.push('/admin-dashboard');
      else if (role === 'moderator') router.push('/moderator-dashboard');
      else router.push('/citizen-dashboard');

    } catch (error) {
      console.error('Auth error:', error);
      toast.error(isLogin ? 'Login failed.' : 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="flip-card-container">
      {/* Iridescent Background */}
      <div className="flip-card-background-fixed">
        <Iridescence 
          color={[0.4, 0.8, 1.0]}
          amplitude={0.7}
          speed={0.35}
          mouseReact={true}
        />
      </div>

      {/* Logo */}
      <motion.div 
        className="flip-card-logo"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="flip-card-logo-icon"
          animate={{
            boxShadow: [
              '0 0 20px rgba(0,212,255,0.3)',
              '0 0 40px rgba(0,212,255,0.6)',
              '0 0 20px rgba(0,212,255,0.3)'
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Shield className="w-8 h-8 text-cyan-400" />
        </motion.div>
        <span className="flip-card-logo-text">Nivaari</span>
      </motion.div>

      {/* 3D Flip Card */}
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-inner">
          {/* Front Side - Login */}
          <div className="flip-card-face flip-card-front">
            <div className="flip-card-content">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="flip-card-title">Welcome Back</h2>
                <p className="flip-card-subtitle">Sign in to continue your journey</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="flip-card-form">
                <div className="flip-card-input-group">
                  <Label htmlFor="login-email" className="flip-card-label">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="flip-card-input"
                    required
                  />
                </div>
                
                <div className="flip-card-input-group">
                  <Label htmlFor="login-password" className="flip-card-label">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="flip-card-input"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="flip-card-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              <div className="flip-card-footer">
                <p className="flip-card-footer-text">
                  Don't have an account?{' '}
                  <button
                    onClick={handleFlip}
                    className="flip-card-link"
                    type="button"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Back Side - Signup */}
          <div className="flip-card-face flip-card-back">
            <div className="flip-card-content">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="flip-card-title">Join Nivaari</h2>
                <p className="flip-card-subtitle">Create your account and stay safe</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="flip-card-form">
                <div className="flip-card-input-group">
                  <Label htmlFor="signup-name" className="flip-card-label">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="flip-card-input"
                    required
                  />
                </div>

                <div className="flip-card-input-group">
                  <Label htmlFor="signup-email" className="flip-card-label">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="flip-card-input"
                    required
                  />
                </div>
                
                <div className="flip-card-input-group">
                  <Label htmlFor="signup-password" className="flip-card-label">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="flip-card-input"
                    required
                  />
                </div>

                <div className="flip-card-input-group">
                  <Label htmlFor="signup-confirm" className="flip-card-label">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-confirm"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="flip-card-input"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="flip-card-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              <div className="flip-card-footer">
                <p className="flip-card-footer-text">
                  Already have an account?{' '}
                  <button
                    onClick={handleFlip}
                    className="flip-card-link"
                    type="button"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
