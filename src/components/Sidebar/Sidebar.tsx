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
  { label: 'Scanner', href: '/pacs/scanner', icon: ScanLine },
  { label: 'Dashboard', href: '/pacs/dashboard', icon: LayoutDashboard },
  { label: 'My Stash', href: '/pacs/stash', icon: Package },
  { label: 'Journal', href: '/pacs/journal', icon: BookOpen },
];

const communityItems: NavItem[] = [
  { label: 'Friends', href: '/pacs/friends', icon: Users },
  { label: 'Circles', href: '/pacs/circles', icon: UsersRound },
  { label: 'Media', href: '/pacs/media', icon: Newspaper },
];

const exploreItems: NavItem[] = [
  { label: 'Registry', href: '/pacs/registry', icon: Leaf },
  { label: 'Learn', href: '/pacs/learn', icon: GraduationCap },
  { label: 'Dispensaries', href: '/pacs/shops', icon: Store },
  { label: 'PACS Assistant', href: '/pacs/assistant', icon: Bot },
];

const bottomItems: NavItem[] = [
  { label: 'Settings', href: '/pacs/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileNav();

  const isActive = (href: string) => {
    if (href === '/pacs/scanner') {
      return pathname === '/pacs' || pathname === '/pacs/scanner';
    }
    if (href === '/pacs/dashboard') return pathname === '/pacs/dashboard';
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
      <Link href="/pacs/scanner" className="sidebar-logo" onClick={close}>
        <Logo size={36} showWordmark />
      </Link>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Scan & Track</span>
        {journeyItems.map(renderItem)}
        <span className="sidebar-section-label">Community</span>
        {communityItems.map(renderItem)}
        <span className="sidebar-section-label">Explore</span>
        {exploreItems.map(renderItem)}
      </nav>

      <div className="sidebar-footer">
        {bottomItems.map(renderItem)}
        <p className="sidebar-tagline">Montana cannabis packaging, verified</p>
      </div>
    </aside>
  );
}
