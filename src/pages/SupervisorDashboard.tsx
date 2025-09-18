import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IframeMapView from '@/components/IframeMapView';

interface AdminRow {
  uid: string;
  name?: string;
  email: string;
  status?: 'online' | 'offline';
  createdAt?: Timestamp;
}

const SupervisorDashboard = () => {
  const [admins, setAdmins] = useState<AdminRow[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: AdminRow[] = [];
      snap.forEach((doc) => rows.push(doc.data() as AdminRow));
      setAdmins(rows);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Control</h1>
            <p className="text-muted-foreground">Monitor admins and invite new ones</p>
          </div>
          <Link to="/create-admin">
            <Button className="bg-indigo-600 hover:bg-indigo-600/90">Create Moderator Invitation</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 h-[480px]">
            <CardHeader>
              <CardTitle className="text-indigo-400">Zones Map (read-only)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-0">
              <IframeMapView height="100%" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Moderators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {admins.length === 0 && (
                  <div className="text-sm text-muted-foreground">No moderators yet</div>
                )}
                {admins.map((a) => (
                  <div key={a.uid} className="flex items-center justify-between p-2 rounded border">
                    <div className="min-w-0">
                      <div className="text-foreground font-medium truncate">{a.name || 'Admin'}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : ''}
                      </div>
                    </div>
                    <Badge className={a.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'}>
                      {a.status || 'offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;


