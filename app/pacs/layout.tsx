"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import { MobileNavProvider, useMobileNav } from '@/context/MobileNavContext';
import './layout.css';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileNav();

  return (
    <div className="app-layout">
      {isOpen && (
        <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={close} />
      )}
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default function BudbookAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignIn = pathname === '/budbook-app/sign-in';

  if (isSignIn) {
    return <>{children}</>;
  }

  return (
    <MobileNavProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </MobileNavProvider>
  );
}
