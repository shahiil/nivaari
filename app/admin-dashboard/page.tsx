'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [invites, setInvites] = useState<{ link: string; expiresAt: string }[]>([]);

  const createInvite = async (type: 'email' | 'sms') => {
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, email, phone }),
    });
    const data = await res.json();
    if (res.ok) {
      setInvites((cur) => [{ link: data.link, expiresAt: data.expiresAt }, ...cur]);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background/60 to-background/90">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>City Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[520px] rounded-xl overflow-hidden">
            <MapView />
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>Moderators (live)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No moderators yet. They will appear here as you add them.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>Create New Moderators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Moderator email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Moderator phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="flex gap-3">
              <Button onClick={() => createInvite('email')}>Send Email Invitation</Button>
              <Button variant="outline" onClick={() => createInvite('sms')}>Send SMS Invitation</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invitations yet.</p>
            ) : (
              invites.map((i, idx) => (
                <div key={idx} className="rounded-md p-3 border bg-background/40 flex items-center justify-between">
                  <span className="truncate text-sm mr-3">{i.link}</span>
                  <span className="text-xs text-muted-foreground">Expires: {new Date(i.expiresAt).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}