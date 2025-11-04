'use client';

import React from 'react';
import RotatingText from './RotatingText';
import './RotatingText.css';

/**
 * Hero headline component featuring "Stay [Safe/Informed/Protected]"
 * with rotating animated text
 */
export default function HeroHeadline() {
  const rotatingWords = ['Safe', 'Informed', 'Protected'];

  return (
    <div className="hero-headline-container">
      <h1 className="hero-headline">
        <span className="hero-headline-static">Stay </span>
        <RotatingText
          texts={rotatingWords}
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
    </div>
  );
}
