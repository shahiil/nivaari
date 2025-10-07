'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const categories = ['Infrastructure', 'Health', 'Safety', 'Environment', 'Miscellaneous'];

export default function CitizenDashboard() {
  const [active, setActive] = useState<string | null>(null);
  type ApprovedReport = { id?: string; title: string; type: string; city?: string };
  const [reports, setReports] = useState<ApprovedReport[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/citizen-reports', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setReports(data.reports);
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
              <Button key={c} variant={active === c ? 'default' : 'outline'} size="sm" onClick={() => setActive(active === c ? null : c)}>
                {c}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
          <CardHeader>
            <CardTitle>Approved Reports</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved reports yet. They will appear here once moderators approve them.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="rounded-lg p-4 border shadow-card bg-background/40">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-muted-foreground">{r.type} {r.city ? `• ${r.city}` : ''}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}