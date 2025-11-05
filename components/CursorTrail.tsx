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
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {trails.map((trail) => (
          <motion.div
            key={trail.id}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-3 h-3 rounded-full bg-cyan-400/40 blur-sm"
            style={{
              left: trail.x - 6,
              top: trail.y - 6,
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Main cursor dot */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-cyan-400/60 blur-[2px]"
        animate={{
          left: mousePosition.x - 4,
          top: mousePosition.y - 4,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
      />
    </div>
  );
}
