'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Shield, Copy, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import './FlipAuthCard.css';

interface FlipAuthCardProps {
  initialMode?: 'login' | 'signup';
}

export default function FlipAuthCard({ initialMode = 'login' }: FlipAuthCardProps) {
  const router = useRouter();
  const { currentUser, userData, loading, refresh } = useAuth();
  const [isFlipped, setIsFlipped] = useState(initialMode === 'signup');
  const [hasGeneratedCredentials, setHasGeneratedCredentials] = useState(false);
  const [credentials, setCredentials] = useState({ socialId: '', recoveryKey: '' });
  const [loginData, setLoginData] = useState({
    socialId: '',
    recoveryKey: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && currentUser && userData) {
      // all users navigate to homepage by default
      router.push('/');
    }
  }, [currentUser, userData, loading, router]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setLoginData({ socialId: '', recoveryKey: '' });
    setHasGeneratedCredentials(false);
  };

  const getPostAuthRedirect = () => {
    const fallback = '/';
    const redirectPath = sessionStorage.getItem('postLoginRedirect');
    if (!redirectPath) {
      return fallback;
    }

    sessionStorage.removeItem('postLoginRedirect');
    return redirectPath;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.socialId || !loginData.recoveryKey) {
      toast.error('Please enter your Social ID and Recovery Key');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/anonymous/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socialId: loginData.socialId.trim().toUpperCase(),
          recoveryKey: loginData.recoveryKey.trim().toUpperCase(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(result?.error ?? 'Unable to recover account');
        return;
      }

      await refresh();
      toast.success('Account recovered successfully!');
      requestPermissionsAndProceed();
    } catch (error) {
      toast.error('Unable to recover account right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCredentials = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/anonymous/signup', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(result?.error ?? 'Unable to generate credentials');
        return;
      }

      const generatedSocialId = result?.credentials?.socialId;
      const generatedRecoveryKey = result?.credentials?.recoveryKey;

      if (!generatedSocialId || !generatedRecoveryKey) {
        toast.error('Generated credentials are incomplete. Please try again.');
        return;
      }

      setCredentials({ socialId: generatedSocialId, recoveryKey: generatedRecoveryKey });
      setHasGeneratedCredentials(true);
      toast.success('Anonymous credentials generated!');
    } catch (error) {
      toast.error('Unable to generate credentials right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    const textToCopy = `Nivaari Social ID: ${credentials.socialId}\nRecovery Key: ${credentials.recoveryKey}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('Credentials copied to clipboard!');
  };

  const continueWithGeneratedAccount = async () => {
    if (!credentials.socialId || !credentials.recoveryKey) {
      toast.error('Missing credentials. Please generate again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/anonymous/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socialId: credentials.socialId,
          recoveryKey: credentials.recoveryKey,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result?.error ?? 'Unable to finalize account login');
        return;
      }

      await refresh();
      toast.success('Account created successfully. Requesting permissions...');
      requestPermissionsAndProceed();
    } catch (error) {
      toast.error('Unable to finalize login right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestPermissionsAndProceed = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log("Location access granted"), 
        (err) => console.log("Location access denied", err)
      );
    }
    router.push(getPostAuthRedirect());
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="flip-card-container">
      {/* Background removed - now handled by parent page */}

      {/* 3D Flip Card */}
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-inner">
          {/* Front Side - Login (Account Recovery) */}
          <div className="flip-card-face flip-card-front">
            <div className="flip-card-content">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-center mb-4">
                  <Shield className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="flip-card-title">Recover Account</h2>
                <p className="flip-card-subtitle">Enter your anonymous credentials</p>
              </motion.div>

              <form onSubmit={handleLoginSubmit} className="flip-card-form">
                <div className="flip-card-input-group">
                  <Label htmlFor="login-social-id" className="flip-card-label">
                    <Key className="w-4 h-4" />
                    Social ID
                  </Label>
                  <Input
                    id="login-social-id"
                    name="socialId"
                    type="text"
                    placeholder="NIV-XXXXXXXXX"
                    value={loginData.socialId}
                    onChange={handleLoginChange}
                    className="flip-card-input font-mono uppercase"
                    required
                  />
                </div>
                
                <div className="flip-card-input-group">
                  <Label htmlFor="login-recovery-key" className="flip-card-label">
                    <Lock className="w-4 h-4" />
                    Recovery Key
                  </Label>
                  <Input
                    id="login-recovery-key"
                    name="recoveryKey"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={loginData.recoveryKey}
                    onChange={handleLoginChange}
                    className="flip-card-input font-mono uppercase"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="flip-card-button cursor-target mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recovering...' : 'Access Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              <div className="flip-card-footer mt-6">
                <p className="flip-card-footer-text">
                  New to Nivaari?{' '}
                  <button
                    onClick={handleFlip}
                    className="flip-card-link cursor-target"
                    type="button"
                  >
                    Create Anonymous ID
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Back Side - Signup (Create Anonymous Account) */}
          <div className="flip-card-face flip-card-back">
            <div className="flip-card-content min-w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h2 className="flip-card-title">Create Identity</h2>
                <p className="flip-card-subtitle">Nivaari uses 100% anonymous identities.</p>
              </motion.div>

              {!hasGeneratedCredentials ? (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <p className="text-sm text-gray-400 text-center mb-4">
                    We will generate a unique Social ID and Recovery Key. No email, phone, or name is required.
                  </p>
                  <Button 
                    onClick={generateCredentials}
                    className="flip-card-button cursor-target w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Generating...' : 'Generate Credentials'}
                    <Key className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-black/30 border border-white/10 p-5 rounded-lg space-y-4">
                    <div>
                      <Label className="text-xs text-blue-400 uppercase tracking-wider">Social ID</Label>
                      <div className="font-mono text-lg text-white font-medium tracking-wide">{credentials.socialId}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-400 uppercase tracking-wider">Recovery Key</Label>
                      <div className="font-mono text-lg text-red-300 font-medium tracking-wide">{credentials.recoveryKey}</div>
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-200">
                    <strong>Critical:</strong> Please copy these credentials. If lost, your account cannot be recovered.
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Button 
                      onClick={handleCopyCredentials}
                      variant="outline"
                      className="w-full border-white/10 hover:bg-white/5 cursor-target flex items-center justify-center py-5"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </Button>

                    <Button 
                      onClick={continueWithGeneratedAccount}
                      className="flip-card-button cursor-target w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'I Saved My Credentials'}
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="flip-card-footer mt-8">
                <p className="flip-card-footer-text">
                  Already have an identity?{' '}
                  <button
                    onClick={handleFlip}
                    className="flip-card-link cursor-target"
                    type="button"
                  >
                    Recover Account
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
