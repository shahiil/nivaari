'use client';

import React from 'react';
import Carousel from './Carousel';
import Image from 'next/image';
import './Carousel.css';

export default function VoicesOfTheCity() {
  const testimonials = [
    {
      title: 'Riya from Mumbai',
      description: 'Reported a fire hazard — got help within minutes!',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=5"
            alt="Riya"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    },
    {
      title: 'Arjun from Delhi',
      description: 'I love how fast the updates come in during emergencies.',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=12"
            alt="Arjun"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    },
    {
      title: 'Neha from Pune',
      description: 'Our community feels more connected and safe now.',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=9"
            alt="Neha"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    },
    {
      title: 'Imran from Hyderabad',
      description: 'Easy to use and genuinely helpful for local alerts.',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=33"
            alt="Imran"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    },
    {
      title: 'Priya from Bangalore',
      description: 'Finally, a platform where our voices are heard!',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=47"
            alt="Priya"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    },
    {
      title: 'Rajesh from Chennai',
      description: 'The real-time alerts saved my family during floods.',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=60"
            alt="Rajesh"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    },
    {
      title: 'Kavita from Kolkata',
      description: 'The best platform for staying updated on city events!',
      icon: (
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=10"
            alt="Kavita"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      )
    }
  ];

  return (
    <section className="py-6 relative z-10">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-3 text-white">
          Voices of the City
        </h2>
        <p className="text-center text-white/80 mb-6 text-lg max-w-2xl mx-auto">
          Real stories from citizens making their cities safer
        </p>
        
        <div className="flex justify-center">
          <Carousel 
            items={testimonials} 
            autoplay 
            loop 
            baseWidth={320}
            interval={4000}
          />
        </div>
      </div>
    </section>
  );
}
