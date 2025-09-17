import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useMongoAuth } from '@/contexts/MongoAuthContext';

const MongoSignupPage = () => {
  const navigate = useNavigate();
  const { currentUser, userData, loading, signup } = useMongoAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && currentUser && userData) {
      if (userData.role === 'admin') navigate('/admin-dashboard');
      else if (userData.role === 'supervisor') navigate('/supervisor-dashboard');
      else navigate('/citizen-dashboard');
    }
  }, [currentUser, userData, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await signup(formData.name, formData.email, formData.password);
      toast.success('Account created successfully!');
      
      // Navigation will be handled by useEffect when user data updates
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      toast.error(errorMessage);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Nivaari</h1>
          <p className="text-white/80">Building better communities together</p>
        </div>

        {/* Signup Form */}
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  disabled={isSubmitting}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-white/80">
                Already have an account?{' '}
                <Link to="/mongo-login" className="text-white hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MongoSignupPage;