import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '@/firebase';
import { doc, getDoc, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

const useQuery = () => new URLSearchParams(useLocation().search);

const AdminInviteRegister = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('Missing token');
        setLoading(false);
        return;
      }
      const ref = doc(db, 'adminInvites', token);
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('Invalid invite link');
          setLoading(false);
          return;
        }
        const data = snap.data() as any;
        const now = new Date();
        const expired = data.expiresAt?.toDate?.() ? data.expiresAt.toDate() < now : false;
        if (data.used) {
          setError('This invite link has already been used.');
          setLoading(false);
          return;
        }
        if (expired) {
          setError('This invite link has expired.');
          setLoading(false);
          return;
        }
        setEmail(data.email);
        setValid(true);
        setLoading(false);
      } catch (e: any) {
        console.error('Invite validation error:', e);
        if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
          try {
            await signInAnonymously(auth);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              setError('Invalid invite link');
              setLoading(false);
              return;
            }
            const data = snap.data() as any;
            const now = new Date();
            const expired = data.expiresAt?.toDate?.() ? data.expiresAt.toDate() < now : false;
            if (data.used) {
              setError('This invite link has already been used.');
              setLoading(false);
              return;
            }
            if (expired) {
              setError('This invite link has expired.');
              setLoading(false);
              return;
            }
            setEmail(data.email);
            setValid(true);
            setLoading(false);
          } catch (e2: any) {
            console.error('Anonymous sign-in or refetch failed:', e2);
            if (e2?.code === 'auth/operation-not-allowed') {
              setError('Invite validation blocked: Enable Anonymous Sign-in in Firebase Auth (Authentication → Sign-in method → Anonymous).');
            } else {
              setError('Unable to validate invite due to permissions. Update Firestore rules to allow reading adminInvites or enable Anonymous sign-in.');
            }
            setLoading(false);
          }
        } else {
          setError('Unable to validate invite. Please try again later.');
          setLoading(false);
        }
      }
    };
    checkToken();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return toast.error('Invalid or expired token');
    if (!password || password !== confirm) return toast.error('Passwords do not match');
    try {
      if (auth.currentUser?.isAnonymous) {
        await signOut(auth);
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateDoc(doc(db, 'adminInvites', token), { used: true });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        role: 'admin',
        status: 'online',
        createdAt: serverTimestamp(),
      });
      // Better: use setDoc to ensure creation
      // We avoided setDoc import to keep bundle small in this minimal placeholder
      toast.success('Admin account created');
      navigate('/login');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register');
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-foreground">Validating token…</div>;
  }

  if (error) {
    return <div className="min-h-screen grid place-items-center text-foreground">{error}</div>;
  }

  if (!valid) {
    return <div className="min-h-screen grid place-items-center text-foreground">Invalid or expired invite link.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Register as Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Create Admin Account</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminInviteRegister;


