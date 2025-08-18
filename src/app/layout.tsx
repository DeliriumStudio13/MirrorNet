import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/providers/client-providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MirrorNet™ - Personal Growth Through Feedback',
  description: 'Receive structured, anonymous feedback from different circles in your life',
  keywords: 'personal growth, feedback, self-improvement, 360 review, personality traits, circles',
  authors: [{ name: 'MirrorNet™' }],
  creator: 'MirrorNet™',
  publisher: 'MirrorNet™',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/mirrornet-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/mirrornet-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/mirrornet-logo.png',
  },
  manifest: '/manifest.json',

  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b5cf6',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        <link rel="icon" href="/favicon.ico?v=3" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/mirrornet-logo.png?v=3" />
        <link rel="icon" href="/mirrornet-logo.png?v=3" sizes="32x32" type="image/png" />
        <link rel="icon" href="/mirrornet-logo.png?v=3" sizes="16x16" type="image/png" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}