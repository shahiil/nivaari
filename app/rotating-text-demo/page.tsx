'use client';

import React, { useRef } from 'react';
import RotatingText, { RotatingTextRef } from '@/components/RotatingText';
import '@/components/RotatingText.css';
import { Button } from '@/components/ui/button';

export default function RotatingTextDemo() {
  const controlledRef = useRef<RotatingTextRef>(null);

  const demos = [
    {
      title: 'Character Stagger (First)',
      description: 'Characters animate from left to right',
      component: (
        <RotatingText
          texts={['Safe', 'Informed', 'Protected']}
          splitBy="character"
          staggerFrom="first"
          staggerDuration={0.3}
          mainClassName="text-5xl font-bold text-cyan-400"
        />
      ),
    },
    {
      title: 'Character Stagger (Center)',
      description: 'Characters animate from center outward',
      component: (
        <RotatingText
          texts={['Security', 'Knowledge', 'Defense']}
          splitBy="character"
          staggerFrom="center"
          staggerDuration={0.4}
          mainClassName="text-5xl font-bold text-purple-400"
        />
      ),
    },
    {
      title: 'Character Stagger (Random)',
      description: 'Characters animate in random order',
      component: (
        <RotatingText
          texts={['Alert', 'Report', 'Notify']}
          splitBy="character"
          staggerFrom="random"
          staggerDuration={0.5}
          mainClassName="text-5xl font-bold text-pink-400"
        />
      ),
    },
    {
      title: 'Word-by-Word',
      description: 'Entire words animate together',
      component: (
        <RotatingText
          texts={['Stay Safe', 'Get Informed', 'Be Protected']}
          splitBy="word"
          staggerFrom="first"
          staggerDuration={0.3}
          mainClassName="text-4xl font-bold text-teal-400"
        />
      ),
    },
    {
      title: 'Fast Rotation',
      description: '1.5 second intervals',
      component: (
        <RotatingText
          texts={['Quick', 'Fast', 'Rapid']}
          rotationInterval={1500}
          splitBy="character"
          staggerDuration={0.2}
          mainClassName="text-5xl font-bold text-orange-400"
        />
      ),
    },
    {
      title: 'Slow & Dramatic',
      description: '5 second intervals with slower stagger',
      component: (
        <RotatingText
          texts={['Vigilant', 'Prepared', 'Cautious']}
          rotationInterval={5000}
          staggerDuration={0.6}
          staggerFrom="center"
          mainClassName="text-5xl font-bold text-indigo-400"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            RotatingText Demos
          </h1>
          <p className="text-xl text-gray-400">
            Smooth animated text rotation with Framer Motion
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {demos.map((demo, index) => (
            <div
              key={index}
              className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
            >
              <h3 className="text-2xl font-bold mb-2 text-white">{demo.title}</h3>
              <p className="text-sm text-gray-400 mb-6">{demo.description}</p>
              <div className="flex items-center justify-center min-h-[120px]">
                {demo.component}
              </div>
            </div>
          ))}
        </div>

        {/* Controlled Example */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">Controlled Example</h2>
          <p className="text-gray-400 mb-8">
            Use imperative controls to navigate through texts
          </p>

          <div className="flex items-center justify-center min-h-[120px] mb-8">
            <RotatingText
              ref={controlledRef}
              texts={['Manual', 'Control', 'Navigation']}
              auto={false}
              mainClassName="text-6xl font-bold text-cyan-400"
            />
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => controlledRef.current?.previous()}
              className="neon-button-purple"
            >
              Previous
            </Button>
            <Button
              onClick={() => controlledRef.current?.next()}
              className="neon-button"
            >
              Next
            </Button>
            <Button
              onClick={() => controlledRef.current?.jumpTo(0)}
              variant="outline"
              className="glass-panel"
            >
              Jump to First
            </Button>
            <Button
              onClick={() => controlledRef.current?.reset()}
              variant="outline"
              className="glass-panel"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Hero Example */}
        <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center">
          <h2 className="text-3xl font-bold mb-8 text-white">Hero Headline Example</h2>
          <div className="flex items-center justify-center gap-4 text-7xl font-bold">
            <span className="text-white">Stay</span>
            <RotatingText
              texts={['Safe.', 'Informed.', 'Protected.']}
              rotationInterval={3000}
              staggerDuration={0.3}
              staggerFrom="first"
              splitBy="character"
              mainClassName="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
            />
          </div>
          <p className="text-gray-400 mt-8 text-lg">
            Perfect for hero sections and headlines
          </p>
        </div>

        {/* Code Example */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Usage Example</h2>
          <div className="bg-gray-800 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              <code>{`import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';

export default function Hero() {
  return (
    <h1>
      <span>Stay </span>
      <RotatingText
        texts={['Safe', 'Informed', 'Protected']}
        rotationInterval={3000}
        staggerDuration={0.3}
        staggerFrom="first"
        splitBy="character"
        loop={true}
        auto={true}
        mainClassName="text-cyan-400"
      />
    </h1>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
