// page.tsx
import React from 'react';

function HeroSectionDemo() {
  return (
    <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Hero Section Demo</h1>
      <p style={{ marginTop: '1rem', color: '#555' }}>
        A simple hero section implemented inline to avoid missing module errors.
      </p>
      <button
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1.25rem',
          background: '#0366d6',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Get started
      </button>
    </section>
  );
}

export default function Page() {
  return <HeroSectionDemo />;
}
