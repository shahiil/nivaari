'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertTriangle, Users, Radio } from 'lucide-react';

export default function HomePage() {
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
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/hero-bg.jpg')"
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Stay Informed. Stay Safe.
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Real-time civic alerts, emergency reporting, and community-driven safety updates for your city
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-saffron hover:bg-saffron/90 text-white px-8 py-4 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white px-8 py-4 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Why Choose Nivaari?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
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
          <Link href="/signup">
            <Button size="lg" className="bg-white text-indigo hover:bg-white/90 px-8 py-4 text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
