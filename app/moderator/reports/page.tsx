"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Unreviewed = { id?: string; title: string; type: string; description: string; city?: string };

export default function ModeratorReportsPage() {
  const [filter, setFilter] = useState<'Unviewed' | 'Approved' | 'Rejected'>('Unviewed');
  const [unreviewed, setUnreviewed] = useState<Unreviewed[]>([]);
  const [approved, setApproved] = useState<Unreviewed[]>([]);
  const [rejected, setRejected] = useState<Unreviewed[]>([]);

  // Live updates via SSE
  useEffect(() => {
    const es = new EventSource('/api/moderator/reports/stream');
    es.addEventListener('snapshot', (evt: MessageEvent) => {
      type Snapshot = { unreviewed?: Unreviewed[]; approved?: Unreviewed[]; rejected?: Unreviewed[] };
      const data: Snapshot = (() => { try { return JSON.parse(evt.data); } catch { return {}; } })();
      setUnreviewed(data.unreviewed ?? []);
      setApproved(data.approved ?? []);
      setRejected(data.rejected ?? []);
    });
    es.addEventListener('error', () => {
      // connection errors are handled by browser's automatic reconnection
    });
    return () => es.close();
  }, []);

  const list = useMemo(() => {
    if (filter === 'Unviewed') return unreviewed;
    if (filter === 'Approved') return approved;
    return rejected;
  }, [filter, unreviewed, approved, rejected]);

  const decide = async (id?: string, decision?: 'approved' | 'rejected') => {
    if (!id || !decision) return;
    const res = await fetch('/api/moderator/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id, decision }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || 'Failed to update');
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background/60 to-background/90">
      <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reports</CardTitle>
          <div className="flex gap-2">
            {(['Unviewed', 'Approved', 'Rejected'] as const).map(v => (
              <Button key={v} variant={filter === v ? 'default' : 'outline'} size="sm" onClick={() => setFilter(v)}>
                {v}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports.</p>
          ) : list.map((r) => (
            <div key={r.id} className="rounded-lg p-4 border shadow-card bg-background/40">
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-muted-foreground">{r.type} {r.city ? `• ${r.city}` : ''}</div>
              {filter === 'Unviewed' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => decide(r.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
