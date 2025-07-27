import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertTriangle, ArrowLeft, Share, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

const AlertDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock alert data - in real app, fetch based on ID
  const alert = {
    id: parseInt(id || '1'),
    type: 'Traffic Accident',
    location: 'MG Road, Bangalore',
    time: '2 hours ago',
    severity: 'high',
    status: 'verified',
    isOfficial: true,
    description: 'Multi-vehicle accident blocking two lanes of traffic. Emergency services on site. Expect significant delays. Alternative routes recommended via Residency Road or Brigade Road.',
    updates: [
      { time: '2 hours ago', message: 'Accident reported and verified' },
      { time: '1.5 hours ago', message: 'Emergency services dispatched' },
      { time: '1 hour ago', message: 'Traffic police arrived on scene' },
      { time: '30 minutes ago', message: 'One lane cleared, cleanup in progress' }
    ],
    reportedBy: 'Traffic Control Center',
    coordinates: { lat: 12.9716, lng: 77.5946 }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-emergency-red text-white';
      case 'medium': return 'bg-emergency-yellow text-black';
      case 'low': return 'bg-emergency-green text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-emergency-green text-white';
      case 'pending': return 'bg-emergency-yellow text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Nivaari Alert: ${alert.type}`,
        text: alert.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Alert link copied to clipboard');
    }
  };

  const handleReport = () => {
    toast.success('Alert reported for review. Thank you for helping keep information accurate.');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Alert Details</h1>
              <p className="text-muted-foreground">Alert #{alert.id}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={handleReport}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Alert Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                    <CardTitle className="text-2xl">{alert.type}</CardTitle>
                  </div>
                  {alert.isOfficial && (
                    <Badge variant="secondary">Official Alert</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {alert.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {alert.time}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity} severity
                  </Badge>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status}
                  </Badge>
                </div>

                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-foreground leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Reported by</h3>
                  <p className="text-muted-foreground">{alert.reportedBy}</p>
                </div>
              </CardContent>
            </Card>

            {/* Updates Timeline */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alert.updates.map((update, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="text-sm text-muted-foreground">{update.time}</div>
                        <div className="text-foreground">{update.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map Preview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-br from-peacock-light/20 to-indigo-light/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Interactive map preview
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Coming with map integration
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                  <strong>Coordinates:</strong><br />
                  {alert.coordinates.lat}, {alert.coordinates.lng}
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Safety Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Avoid the affected area if possible</li>
                  <li>• Use alternative routes</li>
                  <li>• Follow traffic police instructions</li>
                  <li>• Keep emergency contacts handy</li>
                  <li>• Share this alert with others in the area</li>
                </ul>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Police</span>
                  <span className="text-sm font-mono">100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Fire</span>
                  <span className="text-sm font-mono">101</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ambulance</span>
                  <span className="text-sm font-mono">108</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Traffic Helpline</span>
                  <span className="text-sm font-mono">103</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailsPage;