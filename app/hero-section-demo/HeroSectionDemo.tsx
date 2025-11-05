'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RotatingText from '@/components/RotatingText';
import TypeWriter from '@/components/TypeWriter';
import VoicesOfTheCity from '@/components/VoicesOfTheCity';
import CursorTrail from '@/components/CursorTrail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertTriangle, Users, Radio, ChevronRight } from 'lucide-react';
import Link from 'next/link';
const Iridescence = dynamic(() => import('@/components/Iridescence'), { ssr: false });
import '@/components/RotatingText.css';

export default function HeroSectionDemo() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [sectionsVisible, setSectionsVisible] = useState({
    voices: false,
    features: false,
    cta: false
  });

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      const windowHeight = window.innerHeight;
      setSectionsVisible({
        voices: scrollPosition > windowHeight * 0.3,
        features: scrollPosition > windowHeight * 0.8,
        cta: scrollPosition > windowHeight * 1.3
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>{/* paste all your HomePage JSX here */}</div>
  );
}
