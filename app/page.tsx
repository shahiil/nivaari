'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GridScan from '@/components/GridScan';
import TextType from '@/components/TextType';
import StarBorder from '@/components/StarBorder';
import TargetCursor from '@/components/TargetCursor';

export default function HomePage() {
  const containerRef = useRef(null);

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: '100vh', position: 'relative', backgroundColor: '#000000' }}
    >
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
      />
      
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
      
      {/* Top Left Logo and Brand Name */}
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
        className="backdrop-blur-md bg-white/5 px-6 py-3 rounded-full border border-white/10 cursor-target"
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
      
      {/* Top Right Buttons */}
      <div 
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          zIndex: 20,
          display: 'flex',
          gap: '1rem'
        }}
      >
        <Link href="/login">
          <StarBorder
            as="button"
            color="cyan"
            speed="5s"
            className="cursor-pointer cursor-target"
          >
            Login
          </StarBorder>
        </Link>
        <Link href="/signup">
          <StarBorder
            as="button"
            color="cyan"
            speed="5s"
            className="cursor-pointer cursor-target"
          >
            Sign Up
          </StarBorder>
        </Link>
      </div>
      
      {/* Centered Text with Typing Effect */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          textAlign: 'center',
          width: '90%',
          maxWidth: '1200px'
        }}
      >
        <TextType 
          text={["Community Powered.","Stay Informed."]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
          className="text-6xl md:text-8xl font-bold text-white"
          cursorClassName="text-6xl md:text-8xl text-cyan-400"
        />
      </div>
    </div>
  );
}
