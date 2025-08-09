import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';
import emailjs from '@emailjs/browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

// Initialize EmailJS once with the public key for more reliable delivery
emailjs.init({ publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY });

const CreateAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');

    try {
      setSending(true);
      const token = uuidv4();
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      await setDoc(doc(db, 'adminInvites', token), {
        email,
        createdAt: serverTimestamp(),
        expiresAt,
        used: false,
      });

      const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
      const link = `${baseUrl}/admin-register?token=${token}`;

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          secure_link: link,
          subject: 'Nivaari Admin Invitation',
          message: `You’ve been invited to become an admin. Click the link below to register: ${link}`,
          from_name: 'Nivaari',
          to_name: email,
          reply_to: 'no-reply@nivaari.app',
        }
      );

      toast.success('Invitation sent');
      navigate('/supervisor-dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invite');
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


