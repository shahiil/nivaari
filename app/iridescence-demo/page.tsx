'use client';

import dynamic from 'next/dynamic';

const Iridescence = dynamic(() => import('@/components/Iridescence'), { ssr: false });

/**
 * Demo page showcasing different Iridescence variations
 * Visit this page to see the component in action with different settings
 */
export default function IridescenceDemo() {
  const demos = [
    {
      title: 'Default',
      description: 'Balanced settings with mouse interaction',
      props: {},
    },
    {
      title: 'Subtle',
      description: 'Gentle, low-amplitude background',
      props: {
        color: [0.7, 0.8, 0.95] as [number, number, number],
        amplitude: 0.3,
        speed: 0.2,
        mouseReact: false,
      },
    },
    {
      title: 'Intense',
      description: 'High-energy with strong movement',
      props: {
        color: [1.0, 0.5, 0.9] as [number, number, number],
        amplitude: 1.2,
        speed: 0.8,
        mouseReact: true,
      },
    },
    {
      title: 'Ocean Blue',
      description: 'Cool blue-cyan gradient',
      props: {
        color: [0.3, 0.6, 1.0] as [number, number, number],
        amplitude: 0.6,
        speed: 0.4,
        mouseReact: true,
      },
    },
    {
      title: 'Cosmic Purple',
      description: 'Deep purple with pink accents',
      props: {
        color: [0.8, 0.4, 1.0] as [number, number, number],
        amplitude: 0.7,
        speed: 0.5,
        mouseReact: true,
      },
    },
    {
      title: 'Warm Sunset',
      description: 'Orange-pink warm tones',
      props: {
        color: [1.0, 0.6, 0.5] as [number, number, number],
        amplitude: 0.5,
        speed: 0.3,
        mouseReact: true,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Iridescence Demos</h1>
          <p className="text-xl text-gray-400">
            Explore different variations of the Iridescence component
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demos.map((demo, index) => (
            <div
              key={index}
              className="relative h-96 rounded-2xl overflow-hidden border border-white/10"
            >
              {/* Iridescence Background */}
              <Iridescence {...demo.props} />

              {/* Info Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-2xl font-bold mb-2">{demo.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{demo.description}</p>
                
                {/* Props Display */}
                <div className="text-xs font-mono text-gray-400 space-y-1">
                  {demo.props.color && (
                    <div>color: [{demo.props.color.join(', ')}]</div>
                  )}
                  {demo.props.amplitude !== undefined && (
                    <div>amplitude: {demo.props.amplitude}</div>
                  )}
                  {demo.props.speed !== undefined && (
                    <div>speed: {demo.props.speed}</div>
                  )}
                  {demo.props.mouseReact !== undefined && (
                    <div>mouseReact: {demo.props.mouseReact.toString()}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Usage Example</h2>
          <div className="bg-gray-800 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              <code>{`import Iridescence from '@/components/Iridescence';

export default function MyPage() {
  return (
    <section className="relative min-h-screen">
      <Iridescence 
        color={[0.5, 0.7, 1.0]}
        amplitude={0.5}
        speed={0.3}
        mouseReact={true}
      />
      
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </section>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
