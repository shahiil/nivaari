"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// Using simple alert messages for now to avoid dependency friction

const issueTypes = ['Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Healthcare', 'Flooding', 'Other'];

export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
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
        body: JSON.stringify({ title, type, description, location: { address } }),
      });
      const data = await res.json();
      if (res.ok) {
        window.alert('Report submitted');
        setTitle(''); setType(''); setDescription(''); setAddress('');
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
              {issueTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
            <Input placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <Textarea placeholder="Describe the issue" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-3">
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
            <Button variant="outline" onClick={() => navigator.geolocation?.getCurrentPosition((pos) => setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`))}>Use GPS</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
