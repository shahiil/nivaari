"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Modal from '@/components/Modal';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const categories = ['Infrastructure', 'Health', 'Safety', 'Environment', 'Miscellaneous'];

export default function ModeratorDashboard() {
  type BasicReport = { id?: string; title?: string; type: string; city?: string; decidedAt?: string };
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
            <CardTitle>Pending Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <PendingReports
              onDecision={(report, decision) => {
                // When a decision is made in PendingReports, add to approved/rejected lists immediately
                const entry: BasicReport = { id: report.id, title: report.title, type: report.type, city: report.city };
                if (decision === 'approved') {
                  setApproved((s) => [entry, ...s]);
                } else if (decision === 'rejected') {
                  setRejected((s) => [entry, ...s]);
                }
              }}
            />
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

function PendingReports({ onDecision }: { onDecision?: (report: any, decision: 'approved'|'rejected') => void }) {
  type Report = { id?: string; title?: string; reporterName?: string; type: string; description?: string; city?: string; createdAt?: string; createdByUserId?: string };
  const [list, setList] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await fetch('/api/moderator/reports', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && mounted) {
        setList(data.reports || []);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const open = (r: Report) => { setSelected(r); setIsOpen(true); };
  const close = () => { setSelected(null); setIsOpen(false); };

  const decide = async (id?: string, decision?: 'approved'|'rejected') => {
    if (!id || !decision) return;
    const res = await fetch('/api/moderator/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: id, decision }),
    });
    if (res.ok) {
      // remove from pending list locally
      const report = list.find((x) => x.id === id);
      setList((s) => s.filter((x) => x.id !== id));
      // inform parent so it can add to approved/rejected lists
      if (report && onDecision) onDecision(report, decision);
      close();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Failed to update');
    }
  };

  return (
    <div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending reports.</p>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <div key={r.id} className="rounded-lg p-3 border bg-background/40 flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => open(r)}>
                <div className="font-semibold text-sm">{r.type}</div>
                <div className="text-sm text-muted-foreground">{r.title ?? (r.description?.slice(0, 80) + (r.description && r.description.length > 80 ? '...' : ''))}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="italic">{r.reporterName ?? 'Unknown'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={close} title={selected?.title || selected?.type || 'Report'}>
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          <div className="text-sm text-muted-foreground">Category: <strong>{selected?.type}</strong></div>
          <div className="text-sm text-muted-foreground">City: {selected?.city ?? '—'}</div>
          <div className="pt-2 text-foreground">{selected?.description}</div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={() => decide(selected?.id, 'approved')}>Accept</button>
          <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={() => decide(selected?.id, 'rejected')}>Reject</button>
        </div>
      </Modal>
    </div>
  );
}
