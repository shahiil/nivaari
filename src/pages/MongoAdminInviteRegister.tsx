import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useMongoAuth } from '@/contexts/MongoAuthContext';

const useQuery = () => new URLSearchParams(useLocation().search);

const MongoAdminInviteRegister = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';
  const { login } = useMongoAuth();
  
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_PUBLIC_BASE_URL || 'https://nivaari.netlify.app';

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/.netlify/functions/admin-register?token=${encodeURIComponent(token)}`
        );
        
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setValid(true);
          setEmail(data.email);
        } else {
          setError(data.error || 'Invalid or expired invitation token.');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Failed to validate invitation token.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, API_BASE]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !password || !confirm) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/.netlify/functions/admin-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          name,
          password,
          confirmPassword: confirm,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Account created successfully!');
        
        // Auto-login the user
        try {
          await login(email, password);
          // Navigation will be handled by the auth context
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          toast.success('Registration successful! Please log in.');
          navigate('/mongo-login');
        }
      } else {
        throw new Error(data.error || 'Failed to register');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-foreground bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Validating invitation token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center text-foreground bg-background">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen grid place-items-center text-foreground bg-background">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <p>Invalid or expired invite link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Complete Admin Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                  minLength={6}
                  placeholder="Enter your password (min. 6 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input 
                  type="password" 
                  value={confirm} 
                  onChange={(e) => setConfirm(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                  placeholder="Confirm your password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MongoAdminInviteRegister;