import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import toast from 'react-hot-toast';

const CreateAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/.netlify/functions/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          role: 'admin',
        }),
      });

      if (response.status === 404) {
        // Development fallback - Netlify functions not available locally
        console.log('Netlify function not available locally. In production, this would send an email to:', email.trim());
        toast.success('Development mode: Invitation would be sent to ' + email.trim());
        setTimeout(() => {
          navigate('/supervisor-dashboard');
        }, 1500);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send invitation';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success('Invitation sent successfully');
      navigate('/supervisor-dashboard');
    } catch (err: unknown) {
      console.error('Send invitation error:', err);
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create Admin Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-indigo-600 hover:bg-indigo-600/90">
                {sending ? 'Sending…' : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAdmin;


