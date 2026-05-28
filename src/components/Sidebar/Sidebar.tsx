"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Bot,
  GraduationCap,
  LayoutDashboard,
  Newspaper,
  Package,
  ScanLine,
  Settings,
  Store,
  Users,
  UsersRound,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import Logo from '@/components/Logo/Logo';
import { useMobileNav } from '@/context/MobileNavContext';
import './Sidebar.css';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const journeyItems: NavItem[] = [
  { label: 'Dashboard', href: '/budbook-app', icon: LayoutDashboard },
  { label: 'My Stash', href: '/budbook-app/stash', icon: Package },
  { label: 'Journal', href: '/budbook-app/journal', icon: BookOpen },
  { label: 'Scanner', href: '/budbook-app/scanner', icon: ScanLine },
];

const communityItems: NavItem[] = [
  { label: 'Friends', href: '/budbook-app/friends', icon: Users },
  { label: 'Circles', href: '/budbook-app/circles', icon: UsersRound },
  { label: 'Media', href: '/budbook-app/media', icon: Newspaper },
];

const exploreItems: NavItem[] = [
  { label: 'Cannadex', href: '/budbook-app/cannadex', icon: Leaf },
  { label: 'Learn', href: '/budbook-app/learn', icon: GraduationCap },
  { label: 'Dispensaries', href: '/budbook-app/shops', icon: Store },
  { label: 'Buddy AI', href: '/budbook-app/buddy', icon: Bot },
];

const bottomItems: NavItem[] = [
  { label: 'Settings', href: '/budbook-app/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileNav();

  const isActive = (href: string) => {
    if (href === '/budbook-app') return pathname === '/budbook-app';
    return pathname.startsWith(href);
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`sidebar-nav-item ${isActive(item.href) ? 'sidebar-nav-item-active' : ''}`}
        onClick={close}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <Link href="/budbook-app" className="sidebar-logo" onClick={close}>
        <Logo size={36} showWordmark />
      </Link>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">My Journey</span>
        {journeyItems.map(renderItem)}
        <span className="sidebar-section-label">Community</span>
        {communityItems.map(renderItem)}
        <span className="sidebar-section-label">Explore</span>
        {exploreItems.map(renderItem)}
      </nav>

      <div className="sidebar-footer">
        {bottomItems.map(renderItem)}
        <p className="sidebar-tagline">Track responsibly</p>
      </div>
    </aside>
  );
}
