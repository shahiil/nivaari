'use client';

import { BrowserRouter } from 'react-router-dom';
import React from 'react';

export default function ClientRouter({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
