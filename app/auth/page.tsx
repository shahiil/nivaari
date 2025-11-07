'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GridScan from '@/components/GridScan';
import TargetCursor from '@/components/TargetCursor';
import FlipAuthCard from '@/components/FlipAuthCard';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const containerRef = useRef(null);

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', minHeight: '100vh', position: 'relative', backgroundColor: '#000000' }}
    >
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
      />
      
      {/* GridScan Background Effect */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#ffffff"
          gridScale={0.1}
          scanColor="#22b0b5"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
        />
      </div>
      
      {/* Top Left Logo and Brand Name */}
      <Link href="/">
        <div 
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
          className="backdrop-blur-md bg-white/5 px-6 py-3 rounded-full border border-white/10 cursor-target transition-all duration-300 hover:bg-white/10"
        >
          <Image 
            src="/logo-emblem.png" 
            alt="Nivaari Logo" 
            width={40} 
            height={40}
            className="object-contain"
          />
          <span className="text-white text-2xl font-bold tracking-wide">
            Nivaari
          </span>
        </div>
      </Link>
      
      {/* Auth Card */}
      <FlipAuthCard initialMode={initialMode} />
    </div>
  );
}
