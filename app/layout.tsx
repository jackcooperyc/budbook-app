import type { Metadata, Viewport } from 'next';
import { Archivo_Black, DM_Sans, JetBrains_Mono } from 'next/font/google';
import ThemeScript from '@/components/ThemeScript/ThemeScript';
import { ThemeProvider } from '@/context/ThemeContext';
import './globals.css';

const display = Archivo_Black({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const sans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1a0e' },
  ],
};

export const metadata: Metadata = {
  title: 'BudBook — Cannabis Wellness OS',
  description: 'Personal cannabis journal, stash tracking, and wellness insights.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
