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
  '/pacs': 'COA Scanner',
  '/pacs/scanner': 'COA Scanner',
  '/pacs/dashboard': 'Dashboard',
  '/pacs/stash': 'My Stash',
  '/pacs/journal': 'Journal',
  '/pacs/friends': 'Friends',
  '/pacs/circles': 'Circles',
  '/pacs/media': 'Media',
  '/pacs/post/new': 'New Post',
  '/pacs/registry': 'Registry',
  '/pacs/learn': 'Learn',
  '/pacs/shops': 'Dispensaries',
  '/pacs/assistant': 'PACS Assistant',
  '/pacs/profile': 'Profile',
  '/pacs/settings': 'Settings',
};

export default function Header() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useMobileNav();
  const { user, avatarSeed } = useCurrentUser();
  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/pacs/shops/') ? 'Shop menu' :
    pathname.startsWith('/pacs/registry/') ? 'Registry' :
    'Pacs.MT');

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
          <input type="search" placeholder="Search products, sessions…" aria-label="Search" />
        </div>
        <ThemeToggle />
        <Link href="/pacs/profile" className="header-avatar-btn" onClick={close} aria-label="Profile">
          <Avatar
            name={user?.full_name ?? 'Pacs.MT user'}
            seed={avatarSeed}
            size="sm"
          />
        </Link>
      </div>
    </header>
  );
}
