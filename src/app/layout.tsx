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
  // Remove icons from metadata to prevent conflicts with manual head links
  manifest: '/manifest.json',
  metadataBase: new URL('https://mirrornet.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MirrorNet™ - Personal Growth Through Feedback',
    description: 'The honest, anonymous feedback platform for personal growth and stronger relationships',
    url: 'https://mirrornet.net',
    siteName: 'MirrorNet™',
    images: [
      {
        url: '/mirrornet-logo.png',
        width: 1200,
        height: 630,
        alt: 'MirrorNet™ Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MirrorNet™ - Personal Growth Through Feedback',
    description: 'The honest, anonymous feedback platform for personal growth and stronger relationships',
    images: ['/mirrornet-logo.png'],
  },
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
        {/* Enhanced SEO and Social Media Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="application-name" content="MirrorNet™" />
        <meta name="apple-mobile-web-app-title" content="MirrorNet™" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://mirrornet.net" />
        <link rel="icon" href="/favicon.ico?v=4&t=1735037200" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico?v=4&t=1735037200" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/mirrornet-logo.png?v=4&t=1735037200" />
        <link rel="icon" href="/mirrornet-logo.png?v=4&t=1735037200" sizes="32x32" type="image/png" />
        <link rel="icon" href="/mirrornet-logo.png?v=4&t=1735037200" sizes="16x16" type="image/png" />
        <meta name="msapplication-TileImage" content="/mirrornet-logo.png?v=4&t=1735037200" />
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}