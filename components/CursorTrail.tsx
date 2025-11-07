'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trail {
  id: number;
  x: number;
  y: number;
}

export default function CursorTrail() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let trailId = 0;
    // Hide the native cursor while the trail is active
    try {
      document.documentElement.classList.add('hide-cursor');
    } catch {}

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Add new trail point
      const newTrail: Trail = {
        id: trailId++,
        x: e.clientX,
        y: e.clientY,
      };

      setTrails((prev) => [...prev, newTrail]);

      // Remove trail after animation completes
      setTimeout(() => {
        setTrails((prev) => prev.filter((t) => t.id !== newTrail.id));
      }, 800);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      try {
        document.documentElement.classList.remove('hide-cursor');
      } catch {}
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {trails.map((trail) => (
          <motion.div
            key={trail.id}
            initial={{ scale: 1, opacity: 0.8, backgroundColor: 'rgba(34,211,238,0.55)' }}
            animate={{
              scale: 0.35,
              opacity: 0,
              backgroundColor: [
                'rgba(34,211,238,0.55)',
                'rgba(255,255,255,0.95)',
                'rgba(34,211,238,0.55)'
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute w-4 h-4 rounded-full blur-md cursor-trail-dot"
            style={{
              left: trail.x - 8,
              top: trail.y - 8,
              // Use a soft gradient-like background as fallback for environments
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(34,211,238,0.55))'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
