"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const categories = ['Infrastructure', 'Health', 'Safety', 'Environment', 'Miscellaneous'];

export default function ModeratorDashboard() {
  type BasicReport = { id?: string; title: string; type: string; city?: string; decidedAt?: string };
  const [approved, setApproved] = useState<BasicReport[]>([]);
  const [rejected, setRejected] = useState<BasicReport[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/moderator/reports/summary', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setApproved(data.approved || []);
        setRejected(data.rejected || []);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background/60 to-background/90">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent className="h-[520px] rounded-xl overflow-hidden">
            <MapView />
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="px-3 py-1 rounded-md border text-sm bg-background/40">{c}</span>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader><CardTitle>Approved Reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {approved.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved reports yet.</p>
            ) : approved.map((r) => (
              <div key={r.id} className="rounded-lg p-4 border shadow-card bg-background/40">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.type} {r.city ? `• ${r.city}` : ''}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader><CardTitle>Rejected Reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rejected.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rejected reports.</p>
            ) : rejected.map((r) => (
              <div key={r.id} className="rounded-lg p-4 border shadow-card bg-background/40">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.type} {r.city ? `• ${r.city}` : ''}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
