'use client';

import FlipAuthCard from '@/components/FlipAuthCard';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  // Store referrer for post-login redirect
  useEffect(() => {
    if (from) {
      sessionStorage.setItem('postLoginRedirect', from);
    }
  }, [from]);

  return <FlipAuthCard initialMode="login" />;
}