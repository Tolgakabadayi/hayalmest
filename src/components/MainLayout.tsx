'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminOrHost = pathname?.startsWith('/admin') || pathname?.startsWith('/host');

  return (
    <main className={`flex-grow ${isAdminOrHost ? 'pt-4' : 'pt-20'}`}>
      {children}
    </main>
  );
}
