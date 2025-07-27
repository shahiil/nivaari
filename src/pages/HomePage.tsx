import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertTriangle, Users, Radio } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';

const HomePage = () => {
  const features = [
    {
      icon: MapPin,
      title: "Live Map Alerts",
      description: "Real-time updates on incidents and emergencies across your city"
    },
    {
      icon: Users,
      title: "Citizen Reports",
      description: "Community-driven incident reporting for faster response times"
    },
    {
      icon: Radio,
      title: "Emergency Broadcast",
      description: "Instant notifications for critical safety alerts and updates"
    },
    {
      icon: AlertTriangle,
      title: "Smart Routing",
      description: "Avoid danger zones with intelligent route recommendations"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[90vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo/80 via-peacock/70 to-transparent"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Stay Informed.
            <span className="block bg-gradient-to-r from-saffron to-saffron-light bg-clip-text text-transparent">
              Stay Safe.
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Real-time civic emergency alerts and incident reporting for a safer community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/citizen">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white px-8 py-4 text-lg">
                Live City Map
              </Button>
            </Link>
            <Link to="/report">
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg backdrop-blur-sm">
                Report an Issue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            What is Nivaari?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Nivaari is a comprehensive civic emergency management platform that connects citizens 
            with local authorities to create safer communities. Through real-time incident reporting, 
            live emergency alerts, and collaborative safety mapping, we empower citizens to stay 
            informed and help make their neighborhoods safer for everyone.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How Nivaari Helps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive safety features designed to keep you and your community protected
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Make Your City Safer?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of citizens who are already using Nivaari to stay informed and help their communities
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-indigo hover:bg-white/90 px-8 py-4 text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;