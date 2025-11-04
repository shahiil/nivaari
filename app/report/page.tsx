"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// Using simple alert messages for now to avoid dependency friction

const issueTypes = [
  { id: 'potholes', label: 'Road Damage' },
  { id: 'water', label: 'Water Supply' },
  { id: 'streetlight', label: 'Electricity' },
  { id: 'garbage', label: 'Garbage' },
  { id: 'other', label: 'Healthcare' },
  { id: 'water', label: 'Flooding' },
  { id: 'other', label: 'Other' },
];

export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title || !type || !description) {
      window.alert('Please fill in title, type and description');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/citizen-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, description, location: { address, lat: lat === '' ? undefined : lat, lng: lng === '' ? undefined : lng } }),
      });
      const data = await res.json();
      if (res.ok) {
        window.alert('Report submitted');
  setTitle(''); setType(''); setDescription(''); setAddress(''); setLat(''); setLng('');
      } else {
        window.alert(data?.error || 'Failed to submit report');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background/60 to-background/90">
      <Card className="max-w-2xl mx-auto bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-elegant">
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="border rounded-md h-10 px-3 bg-background/60" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select Issue Type</option>
              {issueTypes.map((t) => (<option key={t.label} value={t.id}>{t.label}</option>))}
            </select>
            <Input placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Latitude (optional)" value={lat} onChange={(e) => setLat(e.target.value ? Number(e.target.value) : '')} />
            <Input placeholder="Longitude (optional)" value={lng} onChange={(e) => setLng(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <Textarea placeholder="Describe the issue" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-3">
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
            <Button variant="outline" onClick={() => navigator.geolocation?.getCurrentPosition((pos) => { setLat(Number(pos.coords.latitude.toFixed(6))); setLng(Number(pos.coords.longitude.toFixed(6))); setAddress(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`); })}>Use GPS</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
