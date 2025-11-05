'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Carousel.css';

interface CarouselItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CarouselProps {
  items: CarouselItem[];
  autoplay?: boolean;
  loop?: boolean;
  baseWidth?: number;
  interval?: number;
}

export default function Carousel({
  items,
  autoplay = true,
  loop = true,
  baseWidth = 320,
  interval = 4000,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerView, setItemsPerView] = useState(1);

  // Calculate items per view based on window width
  useEffect(() => {
    const calculateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1280) return 3; // xl screens
      if (width >= 768) return 2;  // md screens
      return 1; // mobile
    };

    setItemsPerView(calculateItemsPerView());

    const handleResize = () => {
      setItemsPerView(calculateItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, items.length - itemsPerView);

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= maxIndex) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [maxIndex, loop]);

  const previous = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return loop ? maxIndex : 0;
      }
      return prev - 1;
    });
  }, [maxIndex, loop]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (!autoplay || isHovered) {
      if (autoplayTimeoutRef.current) {
        clearInterval(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
      return;
    }

    autoplayTimeoutRef.current = setInterval(next, interval);
    
    return () => {
      if (autoplayTimeoutRef.current) {
        clearInterval(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
    };
  }, [autoplay, interval, next, isHovered]);

  // Handle mouse wheel scrolling with debounce
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isHovered) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Clear existing timeout
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      
      // Debounce wheel events
      wheelTimeoutRef.current = setTimeout(() => {
        if (Math.abs(e.deltaY) > 10) {
          if (e.deltaY > 0) {
            next();
          } else {
            previous();
          }
        }
      }, 50);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current);
        }
      };
    }
  }, [isHovered, next, previous]);

  return (
    <div 
      ref={containerRef}
      className="carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="carousel-track" 
        style={{ 
          transform: `translateX(-${currentIndex * (baseWidth + 20)}px)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="carousel-item"
            style={{ width: `${baseWidth}px` }}
          >
            <div className="carousel-card">
              <div className="carousel-icon-wrapper">
                {item.icon}
              </div>
              <h3 className="carousel-title">{item.title}</h3>
              <p className="carousel-description">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="carousel-dots">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        className="carousel-nav carousel-nav-prev"
        onClick={previous}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        className="carousel-nav carousel-nav-next"
        onClick={next}
        aria-label="Next slide"
      >
        ›
      </button>
    </div>
  );
}
