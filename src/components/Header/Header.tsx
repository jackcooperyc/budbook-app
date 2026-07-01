"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  X,
} from 'lucide-react';
import Avatar from '@/components/Avatar/Avatar';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { useMobileNav } from '@/context/MobileNavContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './Header.css';

const pageTitles: Record<string, string> = {
  '/budbook-app': 'Dashboard',
  '/budbook-app/stash': 'My Stash',
  '/budbook-app/journal': 'Journal',
  '/budbook-app/scanner': 'COA Scanner',
  '/budbook-app/friends': 'Friends',
  '/budbook-app/circles': 'Circles',
  '/budbook-app/media': 'Media',
  '/budbook-app/post/new': 'New Post',
  '/budbook-app/cannadex': 'Cannadex',
  '/budbook-app/learn': 'Learn',
  '/budbook-app/shops': 'Dispensaries',
  '/budbook-app/buddy': 'Buddy AI',
  '/budbook-app/profile': 'Profile',
  '/budbook-app/settings': 'Settings',
};

export default function Header() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useMobileNav();
  const { user, avatarSeed } = useCurrentUser();
  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/budbook-app/shops/') ? 'Shop menu' :
    pathname.startsWith('/budbook-app/cannadex/') ? 'Cannadex' :
    'BudBook');

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-btn"
          onClick={toggle}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
        </button>
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <div className="header-search">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input type="search" placeholder="Search strains, sessions…" aria-label="Search" />
        </div>
        <ThemeToggle />
        <Link href="/budbook-app/profile" className="header-avatar-btn" onClick={close} aria-label="Profile">
          <Avatar
            name={user?.full_name ?? 'BudBook user'}
            seed={avatarSeed}
            size="sm"
          />
        </Link>
      </div>
    </header>
  );
}
