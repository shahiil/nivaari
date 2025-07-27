import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, MapPin, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import IframeMapView from '@/components/IframeMapView';

const ReportIssuePage = () => {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    location: '',
    image: null as File | null,
    coordinates: null as { lat: number; lng: number } | null
  });

  const issueTypes = [
    'Pothole',
    'Traffic Accident',
    'Fire Hazard',
    'Flood',
    'Power Outage',
    'Gas Leak',
    'Road Block',
    'Protest/Riot',
    'Medical Emergency',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type && formData.description) {
      toast.success('Report submitted successfully! Awaiting admin approval.');
      // Reset form
      setFormData({
        type: '',
        description: '',
        location: '',
        image: null,
        coordinates: null
      });
    } else {
      toast.error('Please fill in required fields');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report an Issue</h1>
          <p className="text-muted-foreground">Help make your community safer by reporting incidents</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Incident Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Issue Type *</Label>
                <Select onValueChange={handleTypeChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the incident in detail..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Enter location or address"
                    value={formData.location}
                    onChange={handleChange}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3"
                    onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
                <div id="map-section" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    View map location (Mumbai)
                  </p>
                  <div className="h-[300px]">
                    <IframeMapView height="100%" />
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Please enter your location manually in the field above
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Upload Photo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {formData.image ? 'Change Photo' : 'Add Photo'}
                  </Button>
                  {formData.image && (
                    <span className="text-sm text-muted-foreground">
                      {formData.image.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Photos help authorities understand the situation better
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2 text-foreground">Important Note</h3>
          <p className="text-sm text-muted-foreground">
            For immediate emergencies, please contact emergency services directly. 
            This platform is for non-urgent incident reporting and community awareness.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportIssuePage;