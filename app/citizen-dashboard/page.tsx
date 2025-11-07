'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Filter, Plus, Map, List, Image } from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const categories = ['Infrastructure', 'Health', 'Safety', 'Environment', 'Miscellaneous'];
const issueTypes = ['Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Healthcare', 'Flooding', 'Other'];

type ViewMode = 'map' | 'list' | 'image';

export default function CitizenDashboard() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  type ApprovedReport = { 
    id?: string; 
    title: string; 
    type: string; 
    city?: string;
    location?: {
      lat?: number;
      lng?: number;
      address?: string;
    };
  };
  const [reports, setReports] = useState<ApprovedReport[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/citizen-reports', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setReports(data.reports);
    };
    load();
  }, []);

  const filteredReports = selectedCategories.length === 0 
    ? reports 
    : reports.filter(report => selectedCategories.includes(report.type));

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const submitReport = async () => {
    if (!title || !type || !description) {
      alert('Please fill in title, type and description');
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
        alert('Report submitted successfully');
        setTitle(''); setType(''); setDescription(''); setAddress('');
        setReportOpen(false);
        // Reload reports
        const load = async () => {
          const res = await fetch('/api/citizen-reports', { cache: 'no-store' });
          const data = await res.json();
          if (res.ok) setReports(data.reports);
        };
        load();
      } else {
        alert(data?.error || 'Failed to submit report');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full relative">
      {/* View Selector - Top Right */}
      <div className="fixed top-6 right-6 z-[5000] pointer-events-auto">
        <Select value={currentView} onValueChange={(value: ViewMode) => setCurrentView(value)}>
          <SelectTrigger className="w-32 bg-white/90 backdrop-blur-sm border-gray-300 shadow-lg">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent className="z-[5001]">
            <SelectItem value="map">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Map
              </div>
            </SelectItem>
            <SelectItem value="list">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </div>
            </SelectItem>
            <SelectItem value="image">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Render different views based on currentView */}
      {currentView === 'map' && (
        <>
          {/* Map takes full height */}
          <div className="absolute inset-0">
            <MapView reports={filteredReports} />
          </div>
        </>
      )}

      {currentView === 'list' && (
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Approved Reports</h2>
          {filteredReports.length === 0 ? (
            <p className="text-muted-foreground">No approved reports yet. They will appear here once moderators approve them.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{report.type}</p>
                      {report.city && <p className="text-sm text-muted-foreground">{report.city}</p>}
                      {report.location?.address && <p className="text-sm text-muted-foreground">{report.location.address}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {currentView === 'image' && (
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Reports Gallery</h2>
          {filteredReports.length === 0 ? (
            <p className="text-muted-foreground">No approved reports yet. They will appear here once moderators approve them.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-3">
                      <Map className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-sm truncate">{report.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{report.type}</p>
                    {report.city && <p className="text-xs text-muted-foreground truncate">{report.city}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Button - Bottom Left (only show on map view) */}
      {currentView === 'map' && (
        <div className="fixed bottom-6 left-6 z-[2000] pointer-events-auto">
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg bg-white hover:bg-gray-100 border-2 border-gray-300">
                <Filter className="h-5 w-5 text-black" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-80 max-w-[90vw] z-[3000]">
              <DialogHeader>
                <DialogTitle>Filter Reports</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-6">
                <h4 className="font-medium">Select Categories</h4>
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                    />
                    <label htmlFor={category} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Report Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-[2000] pointer-events-auto">
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg bg-white hover:bg-gray-100 border-2 border-gray-300">
              <Plus className="h-5 w-5 text-black" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-96 max-w-[90vw] z-[3000]">
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <select 
                className="w-full border rounded-md h-10 px-3 bg-background/60" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select Issue Type</option>
                {issueTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <Textarea placeholder="Describe the issue" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="flex gap-3">
                <Button onClick={submitReport} disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigator.geolocation?.getCurrentPosition((pos) => setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`))}
                >
                  Use GPS
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}