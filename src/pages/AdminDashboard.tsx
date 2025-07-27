import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import IframeMapView from '@/components/IframeMapView';

const AdminDashboard = () => {
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [selectedZoneColor, setSelectedZoneColor] = useState('red');
  const [showZoneDrawer, setShowZoneDrawer] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: '',
    location: '',
    severity: '',
    description: ''
  });

  // Mock pending reports
  const mockReports = [
    {
      id: 1,
      type: 'Pothole',
      location: 'Brigade Road',
      description: 'Large pothole causing traffic issues',
      submittedBy: 'Citizen #1234',
      time: '2 hours ago',
      image: true
    },
    {
      id: 2,
      type: 'Streetlight',
      location: 'Commercial Street',
      description: 'Multiple streetlights not working',
      submittedBy: 'Citizen #5678',
      time: '4 hours ago',
      image: false
    },
    {
      id: 3,
      type: 'Traffic Signal',
      location: 'Silk Board Junction',
      description: 'Traffic signal malfunctioning during peak hours',
      submittedBy: 'Citizen #9012',
      time: '6 hours ago',
      image: true
    }
  ];

  const handleApprove = (reportId: number) => {
    toast.success(`Report #${reportId} approved and published to citizen dashboard`);
  };

  const handleReject = (reportId: number) => {
    toast.error(`Report #${reportId} rejected`);
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlert.type && newAlert.location && newAlert.severity) {
      toast.success('Official alert broadcasted to all citizens');
      setNewAlert({ type: '', location: '', severity: '', description: '' });
      setShowAddAlert(false);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Control Panel</h1>
            <p className="text-muted-foreground">Manage incidents and emergency alerts</p>
          </div>
          <Button 
            onClick={() => setShowAddAlert(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Official Alert
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] shadow-card">
              <CardHeader>
                <CardTitle className="text-peacock">Live City Map - Admin View</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full relative">
                <div className="h-full rounded-lg overflow-hidden">
                  <IframeMapView height="100%" />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-md z-[1000]">
                  <div className="mb-2">
                    <Select value={selectedZoneColor} onValueChange={setSelectedZoneColor}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Zone Color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="red">Red Zone (High Risk)</SelectItem>
                        <SelectItem value="orange">Orange Zone (Medium Risk)</SelectItem>
                        <SelectItem value="yellow">Yellow Zone (Low Risk)</SelectItem>
                        <SelectItem value="green">Green Zone (Safe)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-emergency-red text-emergency-red hover:bg-emergency-red/10"
                      onClick={() => {
                        setSelectedZoneColor('red');
                        setShowZoneDrawer(true);
                      }}
                    >
                      Draw Red Zone
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-emergency-yellow text-emergency-yellow hover:bg-emergency-yellow/10"
                      onClick={() => {
                        setSelectedZoneColor('yellow');
                        setShowZoneDrawer(true);
                      }}
                    >
                      Draw Yellow Zone
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-emergency-green text-emergency-green hover:bg-emergency-green/10"
                      onClick={() => {
                        setSelectedZoneColor('green');
                        setShowZoneDrawer(true);
                      }}
                    >
                      Mark Safe Zone
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        setShowZoneDrawer(false);
                        toast.success('Returning to normal map view');
                      }}
                    >
                      Exit Draw Mode
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            <Card className="shadow-card bg-gradient-to-br from-saffron/10 to-peacock/10">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-saffron">24</div>
                <div className="text-sm text-muted-foreground">Pending Reports</div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-gradient-to-br from-peacock/10 to-indigo/10">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-peacock">156</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-gradient-to-br from-indigo/10 to-saffron/10">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-indigo">89%</div>
                <div className="text-sm text-muted-foreground">Response Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">Pending Reports</TabsTrigger>
              <TabsTrigger value="zones">Zone Manager</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {mockReports.map((report) => (
                  <Card key={report.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">{report.type}</span>
                            <Badge variant="outline">{report.submittedBy}</Badge>
                            {report.image && <Badge className="bg-peacock text-white">Has Image</Badge>}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {report.location}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {report.time}
                            </div>
                          </div>
                          <p className="mt-2 text-foreground">{report.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            className="bg-emergency-green hover:bg-emergency-green/90"
                            onClick={() => handleApprove(report.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(report.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="zones" className="space-y-4 mt-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Zone Drawing Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 border-2 border-emergency-red/30">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-emergency-red rounded-full mx-auto mb-2"></div>
                        <h3 className="font-semibold text-emergency-red">Red Zone</h3>
                        <p className="text-sm text-muted-foreground">High risk areas</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Draw Red Zone
                        </Button>
                      </div>
                    </Card>
                    <Card className="p-4 border-2 border-emergency-yellow/30">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-emergency-yellow rounded-full mx-auto mb-2"></div>
                        <h3 className="font-semibold text-emergency-yellow">Yellow Zone</h3>
                        <p className="text-sm text-muted-foreground">Caution areas</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Draw Yellow Zone
                        </Button>
                      </div>
                    </Card>
                    <Card className="p-4 border-2 border-emergency-green/30">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-emergency-green rounded-full mx-auto mb-2"></div>
                        <h3 className="font-semibold text-emergency-green">Green Zone</h3>
                        <p className="text-sm text-muted-foreground">Safe areas</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Mark Safe Zone
                        </Button>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Alert Modal */}
        {showAddAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md shadow-elegant">
              <CardHeader>
                <CardTitle>Broadcast Official Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAlert} className="space-y-4">
                  <div>
                    <Label htmlFor="alert-type">Alert Type</Label>
                    <Select onValueChange={(value) => setNewAlert(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alert type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="weather">Weather Alert</SelectItem>
                        <SelectItem value="traffic">Traffic Update</SelectItem>
                        <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="alert-location">Location</Label>
                    <Input
                      id="alert-location"
                      placeholder="Enter location"
                      value={newAlert.location}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="alert-severity">Severity</Label>
                    <Select onValueChange={(value) => setNewAlert(prev => ({ ...prev, severity: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="alert-description">Description</Label>
                    <Textarea
                      id="alert-description"
                      placeholder="Alert details..."
                      value={newAlert.description}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                      Broadcast Alert
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddAlert(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;