import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertTriangle, Filter } from 'lucide-react';

const CitizenDashboard = () => {
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    type: '',
    severity: '',
    officialOnly: false
  });

  // Mock alerts data
  const mockAlerts = [
    {
      id: 1,
      type: 'Traffic Accident',
      location: 'MG Road, Bangalore',
      time: '2 hours ago',
      severity: 'high',
      status: 'verified',
      isOfficial: true
    },
    {
      id: 2,
      type: 'Pothole',
      location: 'Koramangala 5th Block',
      time: '4 hours ago',
      severity: 'medium',
      status: 'pending',
      isOfficial: false
    },
    {
      id: 3,
      type: 'Power Outage',
      location: 'HSR Layout Sector 2',
      time: '6 hours ago',
      severity: 'medium',
      status: 'verified',
      isOfficial: true
    },
    {
      id: 4,
      type: 'Water Logging',
      location: 'Indiranagar Metro Station',
      time: '8 hours ago',
      severity: 'high',
      status: 'verified',
      isOfficial: true
    }
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Live City Map</h1>
          <p className="text-muted-foreground">Real-time incidents and alerts in your area</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] shadow-card">
              <CardContent className="p-0 h-full">
                <div className="h-full bg-gradient-to-br from-peacock-light/20 to-indigo-light/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Interactive Map</h3>
                    <p className="text-muted-foreground mb-4">
                      Map integration with Leaflet.js coming soon
                    </p>
                    <div className="flex gap-2 justify-center">
                      <div className="w-3 h-3 bg-emergency-red rounded-full"></div>
                      <span className="text-sm text-muted-foreground">High Risk</span>
                      <div className="w-3 h-3 bg-emergency-yellow rounded-full ml-4"></div>
                      <span className="text-sm text-muted-foreground">Medium Risk</span>
                      <div className="w-3 h-3 bg-emergency-green rounded-full ml-4"></div>
                      <span className="text-sm text-muted-foreground">Safe Zone</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Panel */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Search location..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <div>
                  <Select onValueChange={(value) => setFilters(prev => ({ ...prev, date: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Traffic Accident</SelectItem>
                      <SelectItem value="pothole">Pothole</SelectItem>
                      <SelectItem value="power">Power Outage</SelectItem>
                      <SelectItem value="flood">Flooding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="official-only"
                    checked={filters.officialOnly}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, officialOnly: checked }))}
                  />
                  <label htmlFor="official-only" className="text-sm text-foreground">
                    Show only official alerts
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/report">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Report New Issue
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  Emergency Contacts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alerts List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAlerts.map((alert) => (
              <Card key={alert.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">{alert.type}</span>
                    </div>
                    {alert.isOfficial && (
                      <Badge variant="secondary" className="text-xs">Official</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {alert.location}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {alert.time}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </div>
                    <Link to={`/alert/${alert.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;