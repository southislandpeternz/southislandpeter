import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SP2036 Website',
  description:
    'South Island boutique tours — Fixed Shuttle Services, Cruise Ship Day Tours, and Christchurch Airport Transfers.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
