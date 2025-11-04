'use client';

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence, Transition, TargetAndTransition } from 'framer-motion';

// Types
export interface RotatingTextProps {
  /** Array of words to rotate through */
  texts: string[];
  /** Time in ms before switching to next text */
  rotationInterval?: number;
  /** Duration of stagger effect in seconds */
  staggerDuration?: number;
  /** Direction to stagger from */
  staggerFrom?: 'first' | 'last' | 'center' | 'random';
  /** Split animation by character or word */
  splitBy?: 'character' | 'word';
  /** Whether to loop through texts continuously */
  loop?: boolean;
  /** Whether to auto-rotate */
  auto?: boolean;
  /** Class name for main container */
  mainClassName?: string;
  /** Class name for split level (word/character container) */
  splitLevelClassName?: string;
  /** Class name for individual elements */
  elementLevelClassName?: string;
  /** Custom initial animation variant */
  initial?: TargetAndTransition;
  /** Custom animate variant */
  animate?: TargetAndTransition;
  /** Custom exit variant */
  exit?: TargetAndTransition;
  /** Custom transition */
  transition?: Transition;
}

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
  getCurrentIndex: () => number;
}

// Utility: Split text into graphemes using Intl.Segmenter
const splitIntoGraphemes = (text: string): string[] => {
  // Check if Intl.Segmenter is available
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
      const segments = segmenter.segment(text);
      return Array.from(segments, (s: any) => s.segment);
    } catch (e) {
      // Fallback if Segmenter fails
      return text.split('');
    }
  }
  // Fallback for older browsers
  return text.split('');
};

// Utility: Split text by words
const splitIntoWords = (text: string): string[] => {
  return text.split(' ').filter(word => word.length > 0);
};

// Utility: Calculate stagger delay
const getStaggerDelay = (
  index: number,
  total: number,
  staggerFrom: 'first' | 'last' | 'center' | 'random',
  staggerDuration: number
): number => {
  const delayPerItem = staggerDuration / total;

  switch (staggerFrom) {
    case 'last':
      return (total - 1 - index) * delayPerItem;
    case 'center':
      const center = Math.floor(total / 2);
      const distanceFromCenter = Math.abs(index - center);
      return distanceFromCenter * delayPerItem;
    case 'random':
      return Math.random() * staggerDuration;
    case 'first':
    default:
      return index * delayPerItem;
  }
};

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      rotationInterval = 3000,
      staggerDuration = 0.3,
      staggerFrom = 'first',
      splitBy = 'character',
      loop = true,
      auto = true,
      mainClassName = '',
      splitLevelClassName = '',
      elementLevelClassName = '',
      initial,
      animate,
      exit,
      transition,
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Navigation functions
    const next = useCallback(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= texts.length) {
          return loop ? 0 : prev;
        }
        return nextIndex;
      });
    }, [texts.length, loop]);

    const previous = useCallback(() => {
      setCurrentIndex((prev) => {
        const prevIndex = prev - 1;
        if (prevIndex < 0) {
          return loop ? texts.length - 1 : 0;
        }
        return prevIndex;
      });
    }, [texts.length, loop]);

    const jumpTo = useCallback(
      (index: number) => {
        if (index >= 0 && index < texts.length) {
          setCurrentIndex(index);
        }
      },
      [texts.length]
    );

    const reset = useCallback(() => {
      setCurrentIndex(0);
    }, []);

    const getCurrentIndex = useCallback(() => currentIndex, [currentIndex]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      next,
      previous,
      jumpTo,
      reset,
      getCurrentIndex,
    }));

    // Auto-rotation effect
    useEffect(() => {
      if (!auto || texts.length <= 1) return;

      const timer = setInterval(() => {
        next();
      }, rotationInterval);

      return () => clearInterval(timer);
    }, [auto, rotationInterval, next, texts.length]);

    // Get current text
    const currentText = texts[currentIndex] || '';

    // Split text based on mode
    const elements = splitBy === 'character' 
      ? splitIntoGraphemes(currentText)
      : splitIntoWords(currentText);

    // Default animation variants
    const defaultInitial: TargetAndTransition = initial || {
      opacity: 0,
      y: 20,
      rotateX: -90,
    };

    const defaultAnimate: TargetAndTransition = animate || {
      opacity: 1,
      y: 0,
      rotateX: 0,
    };

    const defaultExit: TargetAndTransition = exit || {
      opacity: 0,
      y: -20,
      rotateX: 90,
    };

    const defaultTransition: Transition = transition || {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    };

    return (
      <div className={`text-rotate ${mainClassName}`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            className={`text-rotate-word ${splitLevelClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {elements.map((element, index) => {
              const delay = getStaggerDelay(
                index,
                elements.length,
                staggerFrom,
                staggerDuration
              );

              return (
                <motion.span
                  key={`${currentIndex}-${index}-${element}`}
                  className={`text-rotate-element ${elementLevelClassName}`}
                  initial={defaultInitial}
                  animate={defaultAnimate}
                  exit={defaultExit}
                  transition={{
                    ...defaultTransition,
                    delay,
                  }}
                >
                  {element === ' ' ? (
                    <span className="text-rotate-space">&nbsp;</span>
                  ) : (
                    element
                  )}
                </motion.span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }
);

RotatingText.displayName = 'RotatingText';

export default RotatingText;
