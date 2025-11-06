'use client';

import FlipAuthCard from '@/components/FlipAuthCard';
import { useEffect, Suspense } from 'react';
import CursorTrail from '@/components/CursorTrail';
import { useSearchParams } from 'next/navigation';

function SignupContent() {
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

export default function SignupPage() {
  return (
    <>
      <CursorTrail />
      <Suspense fallback={<div>Loading...</div>}>
        <SignupContent />
      </Suspense>
    </>
  );
}