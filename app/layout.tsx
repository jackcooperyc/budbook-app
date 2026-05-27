import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BudBook',
  description: 'Personal cannabis journal and social platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
