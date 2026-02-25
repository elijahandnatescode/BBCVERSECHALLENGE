import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pasuk V3 - Verification System',
  description: 'High-contrast Brutalist Verse Verification',
};

import { ThemeToggle } from '@/components/ThemeToggle';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
