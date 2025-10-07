"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function RegisterForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/');
  }, [token, router]);

  const submit = async () => {
    if (!name || !email || !password) return alert('Fill all fields');
    setSubmitting(true);
    try {
      const res = await fetch('/api/moderator/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, email, password, mobile }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful');
        router.replace('/moderator-dashboard');
      } else {
        alert(data?.error || 'Failed to register');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background/60 to-background/90">
      <Card className="max-w-xl mx-auto bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
        <CardHeader>
          <CardTitle>Moderator Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input placeholder="Mobile (optional)" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <div className="flex gap-3">
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Register'}</Button>
            <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ModeratorRegisterPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
