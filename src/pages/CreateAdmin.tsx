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
  const [inviteLink, setInviteLink] = useState('');

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

      // Prefer a configured public base URL; fall back to current origin during development
      let baseUrl = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim();
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!baseUrl) {
        baseUrl = window.location.origin;
        if (!isLocal) {
          // Non-local without explicit public URL: still proceed, but warn
          toast.success('Using current origin for invite link. Set VITE_PUBLIC_BASE_URL for production.');
        }
      }
      try {
        const u = new URL(baseUrl);
        // Enforce https only for non-local hosts
        if (!isLocal && u.protocol !== 'https:') {
          throw new Error('Base URL must be https in production');
        }
      } catch {
        toast.error('Invalid VITE_PUBLIC_BASE_URL. Use a full https URL (e.g., https://nivaari.netlify.app).');
        setSending(false);
        return;
      }
      const link = `${baseUrl.replace(/\/$/, '')}/admin-register?token=${token}`;
      setInviteLink(link);

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
          from_email: 'no-reply@nivaari.app',
        }
      );

      toast.success('Invitation sent');
      // Keep the link visible for manual sharing in case email delivery is delayed
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invite via email. You can copy the link below and share manually.');
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
            {inviteLink && (
              <div className="mt-4 space-y-2">
                <Label>Invite Link (share manually if needed)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink} />
                  <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(inviteLink).then(() => toast.success('Link copied'))}>
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAdmin;


