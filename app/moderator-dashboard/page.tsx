"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Modal from '@/components/Modal';
import { Home, Map, FileText, Menu, X } from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type BasicReport = { id?: string; title?: string; type: string; city?: string; decidedAt?: string };

export default function ModeratorDashboard() {
  const [activeView, setActiveView] = useState<'home' | 'map' | 'reports'>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleNavigation = (view: 'home' | 'map' | 'reports') => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background/60 to-background/90">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-md bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-2">
          <Button
            variant={activeView === 'home' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleNavigation('home')}
          >
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
          <Button
            variant={activeView === 'map' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleNavigation('map')}
          >
            <Map className="w-5 h-5 mr-3" />
            Map View
          </Button>
          <Button
            variant={activeView === 'reports' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleNavigation('reports')}
          >
            <FileText className="w-5 h-5 mr-3" />
            Pending Reports
          </Button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeView === 'home' && (
          <div className="p-4 md:p-6 space-y-6">
            {/* Map Section - Full Width, Mobile First */}
            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
              <CardHeader>
                <CardTitle>Live Map</CardTitle>
              </CardHeader>
              <CardContent className="h-[60vh] md:h-[520px] rounded-xl overflow-hidden">
                <MapView />
              </CardContent>
            </Card>

            {/* Approved and Rejected Reports - Stacked on Mobile, Side by Side on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
                <CardHeader>
                  <CardTitle>Approved Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {approved.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No approved reports yet.</p>
                  ) : (
                    approved.map((r) => (
                      <div key={r.id} className="rounded-lg p-4 border shadow-card bg-background/40">
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.type} {r.city ? `• ${r.city}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
                <CardHeader>
                  <CardTitle>Rejected Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {rejected.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rejected reports.</p>
                  ) : (
                    rejected.map((r) => (
                      <div key={r.id} className="rounded-lg p-4 border shadow-card bg-background/40">
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.type} {r.city ? `• ${r.city}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'map' && (
          <div className="p-4 md:p-6">
            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
              <CardHeader>
                <CardTitle>Full Map View</CardTitle>
              </CardHeader>
              <CardContent className="h-[80vh] rounded-xl overflow-hidden">
                <MapView />
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'reports' && (
          <div className="p-4 md:p-6">
            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
              <CardHeader>
                <CardTitle>Pending Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <PendingReports
                  onDecision={(report, decision) => {
                    const entry: BasicReport = {
                      id: report.id,
                      title: report.title,
                      type: report.type,
                      city: report.city,
                    };
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
        )}
      </main>
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
