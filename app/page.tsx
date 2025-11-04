'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Iridescence from '@/components/Iridescence';
import RotatingText from '@/components/RotatingText';
import TypeWriter from '@/components/TypeWriter';
import VoicesOfTheCity from '@/components/VoicesOfTheCity';
import '@/components/RotatingText.css';
import { 
  MapPin, 
  AlertTriangle, 
  Users, 
  Radio, 
  Shield, 
  Zap, 
  Bell, 
  TrendingUp, 
  ChevronRight 
} from 'lucide-react';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Handle initial animation and scroll tracking
  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Live Map Alerts",
      description: "Real-time updates on incidents and emergencies across your city",
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      icon: Users,
      title: "Citizen Reports",
      description: "Community-driven incident reporting for faster response times",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: Radio,
      title: "Emergency Broadcast",
      description: "Instant notifications for critical safety alerts and updates",
      gradient: "from-orange-400 to-red-500"
    },
    {
      icon: AlertTriangle,
      title: "Smart Routing",
      description: "Avoid danger zones with intelligent route recommendations",
      gradient: "from-emerald-400 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-background/80 text-foreground relative">
      {/* Full Page Iridescence Background Effect */}
      <div className="fixed inset-0 z-0">
        <Iridescence 
          color={[0.4, 0.8, 1.0]}
          amplitude={0.7}
          speed={0.35}
          mouseReact={true}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 z-10">
        <div className="container mx-auto relative z-10">
          <div className={`text-center transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full mb-8 animate-pulse">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground/90 font-['Montserrat',sans-serif] font-medium">Trusted by 50,000+ citizens</span>
            </div>

            {/* Main Headline with Rotating Text */}
            <h1 className="text-6xl md:text-8xl font-bold mb-6 font-['Playfair_Display',serif]">
              <span className="hero-headline-static">Stay </span>
              <RotatingText
                texts={['Informed.', 'Protected.']}
                rotationInterval={3000}
                staggerDuration={0.3}
                staggerFrom="first"
                splitBy="character"
                loop={true}
                auto={true}
                mainClassName="hero-headline-rotating"
                elementLevelClassName="hero-headline-char"
              />
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-foreground/80 font-['Montserrat',sans-serif] font-light">
              <TypeWriter 
                text="Real-time civic alerts, emergency reporting, and community-driven safety updates. Powered by your community."
                speed={30}
                className="text-white/90 font-light italic font-['Montserrat',sans-serif]"
              />
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Link href="/signup">
                <div className="relative p-[2px] rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient-shift">
                  <Button 
                    size="lg" 
                    className="neon-button group relative px-8 py-6 text-lg font-semibold rounded-xl font-['Montserrat',sans-serif]"
                  >
                    <span className="flex items-center gap-2">
                      Get Started
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold glass-panel rounded-xl
                           transition-all duration-300 hover:scale-105 font-['Montserrat',sans-serif]"
                >
                  Sign In
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Voices of the City - Testimonials Carousel */}
      <VoicesOfTheCity />

      {/* Features Section */}
      <section className="py-6 relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          {/* Section header */}
          <div className="text-center mb-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white mix-blend-overlay font-['Playfair_Display',serif]">
              Why Choose Nivaari?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto font-['Montserrat',sans-serif] font-light">
              Built for the future of civic engagement and community safety
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transform transition-all duration-500 ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="group relative h-full overflow-hidden glass-card">
                  <CardContent className="p-8 relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-card p-3 mb-6 
                                transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <feature.icon className="w-full h-full text-foreground/90" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-foreground/90 
                                group-hover:text-foreground transition-all duration-300 font-['Playfair_Display',serif]">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted leading-relaxed group-hover:text-foreground/80 transition-colors font-['Montserrat',sans-serif] font-normal">
                      {feature.description}
                    </p>

                    {/* Hover arrow indicator */}
                    <div className="mt-6 flex items-center text-primary opacity-0 group-hover:opacity-100 
                                transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
                      <span className="text-sm font-semibold font-['Montserrat',sans-serif]">Learn more</span>
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-6 relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Content container */}
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white font-['Playfair_Display',serif]">
                Ready to Make Your City Safer?
              </h2>
              
              <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed font-['Montserrat',sans-serif] font-light">
                Join thousands of citizens who are already using Nivaari to stay informed and help their communities thrive
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {["Free to use", "Real-time updates", "Community driven", "Privacy focused"].map((item, i) => (
                  <span 
                    key={i}
                    className="px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white/90 hover:bg-white/20 transition-all duration-300 font-['Montserrat',sans-serif] font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="group px-12 py-6 text-lg font-semibold 
                           bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500
                           text-white rounded-full
                           hover:from-cyan-500 hover:via-cyan-600 hover:to-blue-600
                           shadow-lg hover:shadow-xl
                           transition-all duration-300 hover:scale-105 font-['Montserrat',sans-serif]"
                >
                  <span className="flex items-center gap-2">
                    Get Started Today
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>

              <p className="mt-6 text-sm text-white/80 font-['Montserrat',sans-serif] font-light">
                No credit card required • Setup in 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
