'use client';

import FlipAuthCard from '@/components/FlipAuthCard';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  // Store referrer for post-signup redirect
  useEffect(() => {
    if (from) {
      sessionStorage.setItem('postLoginRedirect', from);
    }
  }, [from]);

  return <FlipAuthCard initialMode="signup" />;
}