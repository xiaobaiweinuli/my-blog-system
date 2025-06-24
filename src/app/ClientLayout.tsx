"use client";

import SeoProvider from '@/components/SeoProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoProvider />
      {children}
    </>
  );
} 