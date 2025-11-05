'use client';

import FlipAuthCard from '@/components/FlipAuthCard';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  return <FlipAuthCard initialMode={initialMode} />;
}
