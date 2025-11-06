'use client';

import FlipAuthCard from '@/components/FlipAuthCard';
import { useEffect, Suspense } from 'react';
import CursorTrail from '@/components/CursorTrail';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
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

export default function LoginPage() {
  return (
    <>
      <CursorTrail />
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </>
  );
}